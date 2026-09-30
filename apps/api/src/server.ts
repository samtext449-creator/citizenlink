import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './lib/database';
import { supabase, uploadDocument } from './lib/supabase';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'CitizenLink API is running'
  });
});

// ============================================
// CUSTOMER ENDPOINTS
// ============================================

// 1. Create a request
app.post('/api/requests', async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, kraPin } = req.body;

    const request = await prisma.request.create({
      data: {
        customerName,
        customerEmail,
        customerPhone,
        kraPin: kraPin || null,
        status: 'PENDING'
      }
    });

    res.status(201).json({
      success: true,
      data: request,
      message: 'Request created successfully'
    });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create request'
    });
  }
});

// 2. Get customer's requests
app.get('/api/requests/:phone', async (req, res) => {
  try {
    const { phone } = req.params;

    const requests = await prisma.request.findMany({
      where: { customerPhone: phone },
      orderBy: { createdAt: 'desc' },
      include: {
        payments: true
      }
    });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch requests'
    });
  }
});

// 3. Get single request with payment
app.get('/api/request/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const request = await prisma.request.findUnique({
      where: { id },
      include: {
        payments: true
      }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch request'
    });
  }
});

// ============================================
// ADMIN ENDPOINTS
// ============================================

// 1. Get all requests (admin)
app.get('/api/admin/requests', async (req, res) => {
  try {
    const { status } = req.query;

    const where = status ? { status: status as string } : {};

    const requests = await prisma.request.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        payments: true
      }
    });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Admin get requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch requests'
    });
  }
});

// 2. Update request status
app.patch('/api/admin/requests/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const request = await prisma.request.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: request,
      message: `Status updated to ${status}`
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status'
    });
  }
});

// 3. Upload document (admin)
app.post('/api/admin/upload', async (req, res) => {
  try {
    const { requestId, fileBase64, fileName } = req.body;

    if (!fileBase64 || !fileName) {
      return res.status(400).json({
        success: false,
        message: 'File data and name are required'
      });
    }

    // Convert base64 to buffer
    const fileBuffer = Buffer.from(fileBase64, 'base64');

    // Upload to Supabase
    const publicUrl = await uploadDocument(requestId, fileBuffer, fileName);

    // Update request with document URL and status
    const request = await prisma.request.update({
      where: { id: requestId },
      data: {
        documentUrl: publicUrl,
        documentPath: `requests/${requestId}/${fileName}`,
        status: 'READY',
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    });

    res.json({
      success: true,
      data: request,
      message: 'Document uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document'
    });
  }
});

// 4. Get document (customer - after payment)
app.get('/api/download/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const request = await prisma.request.findUnique({
      where: { id },
      include: {
        payments: {
          where: { status: 'PAID' }
        }
      }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'COMPLETED') {
      return res.status(403).json({
        success: false,
        message: 'Document not available yet. Please complete payment first.'
      });
    }

    if (!request.documentUrl) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Redirect to Supabase public URL
    res.json({
      success: true,
      documentUrl: request.documentUrl
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get document'
    });
  }
});

// ============================================
// PAYMENT ENDPOINTS (M-Pesa placeholder)
// ============================================

// Initiate payment
app.post('/api/payment/initiate', async (req, res) => {
  try {
    const { requestId } = req.body;

    const request = await prisma.request.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'READY') {
      return res.status(400).json({
        success: false,
        message: 'Document not ready for payment'
      });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        requestId: request.id,
        amount: 250,
        status: 'PENDING'
      }
    });

    // Here you would integrate M-Pesa STK Push
    // For now, just return payment details

    res.json({
      success: true,
      data: payment,
      message: 'Payment initiated. Complete payment to access document.'
    });
  } catch (error) {
    console.error('Payment initiate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate payment'
    });
  }
});

// M-Pesa callback (webhook)
app.post('/api/payment/callback', async (req, res) => {
  try {
    const { transactionCode, requestId } = req.body;

    // Update payment
    const payment = await prisma.payment.update({
      where: { requestId },
      data: {
        status: 'PAID',
        mpesaCode: transactionCode,
        paidAt: new Date()
      }
    });

    // Update request to COMPLETED
    const request = await prisma.request.update({
      where: { id: requestId },
      data: {
        status: 'COMPLETED',
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Payment confirmed, document unlocked'
    });
  } catch (error) {
    console.error('Payment callback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment callback'
    });
  }
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📁 Supabase Storage: documents bucket ready`);
});

export default app;