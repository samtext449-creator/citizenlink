"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var cors_1 = require("cors");
var dotenv_1 = require("dotenv");
var database_1 = require("./lib/database");
var supabase_1 = require("./lib/supabase");
dotenv_1.default.config();
var app = (0, express_1.default)();
var PORT = process.env.PORT || 4000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', function (req, res) {
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
app.post('/api/requests', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, customerName, customerEmail, customerPhone, kraPin, request, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, customerName = _a.customerName, customerEmail = _a.customerEmail, customerPhone = _a.customerPhone, kraPin = _a.kraPin;
                return [4 /*yield*/, database_1.prisma.request.create({
                        data: {
                            customerName: customerName,
                            customerEmail: customerEmail,
                            customerPhone: customerPhone,
                            kraPin: kraPin || null,
                            status: 'PENDING'
                        }
                    })];
            case 1:
                request = _b.sent();
                res.status(201).json({
                    success: true,
                    data: request,
                    message: 'Request created successfully'
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _b.sent();
                console.error('Create request error:', error_1);
                res.status(500).json({
                    success: false,
                    message: 'Failed to create request'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// 2. Get customer's requests
app.get('/api/requests/:phone', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var phone, requests, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                phone = req.params.phone;
                return [4 /*yield*/, database_1.prisma.request.findMany({
                        where: { customerPhone: phone },
                        orderBy: { createdAt: 'desc' },
                        include: {
                            payments: true
                        }
                    })];
            case 1:
                requests = _a.sent();
                res.json({
                    success: true,
                    data: requests
                });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error('Get requests error:', error_2);
                res.status(500).json({
                    success: false,
                    message: 'Failed to fetch requests'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// 3. Get single request with payment
app.get('/api/request/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, request, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = req.params.id;
                return [4 /*yield*/, database_1.prisma.request.findUnique({
                        where: { id: id },
                        include: {
                            payments: true
                        }
                    })];
            case 1:
                request = _a.sent();
                if (!request) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Request not found'
                        })];
                }
                res.json({
                    success: true,
                    data: request
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                console.error('Get request error:', error_3);
                res.status(500).json({
                    success: false,
                    message: 'Failed to fetch request'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// ============================================
// ADMIN ENDPOINTS
// ============================================
// 1. Get all requests (admin)
app.get('/api/admin/requests', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var status_1, where, requests, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                status_1 = req.query.status;
                where = status_1 ? { status: status_1 } : {};
                return [4 /*yield*/, database_1.prisma.request.findMany({
                        where: where,
                        orderBy: { createdAt: 'desc' },
                        include: {
                            payments: true
                        }
                    })];
            case 1:
                requests = _a.sent();
                res.json({
                    success: true,
                    data: requests
                });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                console.error('Admin get requests error:', error_4);
                res.status(500).json({
                    success: false,
                    message: 'Failed to fetch requests'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// 2. Update request status
app.patch('/api/admin/requests/:id/status', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, status_2, request, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = req.params.id;
                status_2 = req.body.status;
                return [4 /*yield*/, database_1.prisma.request.update({
                        where: { id: id },
                        data: {
                            status: status_2,
                            updatedAt: new Date()
                        }
                    })];
            case 1:
                request = _a.sent();
                res.json({
                    success: true,
                    data: request,
                    message: "Status updated to ".concat(status_2)
                });
                return [3 /*break*/, 3];
            case 2:
                error_5 = _a.sent();
                console.error('Update status error:', error_5);
                res.status(500).json({
                    success: false,
                    message: 'Failed to update status'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// 3. Upload document (admin)
app.post('/api/admin/upload', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, requestId, fileBase64, fileName, fileBuffer, publicUrl, request, error_6;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                _a = req.body, requestId = _a.requestId, fileBase64 = _a.fileBase64, fileName = _a.fileName;
                if (!fileBase64 || !fileName) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'File data and name are required'
                        })];
                }
                fileBuffer = Buffer.from(fileBase64, 'base64');
                return [4 /*yield*/, (0, supabase_1.uploadDocument)(requestId, fileBuffer, fileName)];
            case 1:
                publicUrl = _b.sent();
                return [4 /*yield*/, database_1.prisma.request.update({
                        where: { id: requestId },
                        data: {
                            documentUrl: publicUrl,
                            documentPath: "requests/".concat(requestId, "/").concat(fileName),
                            status: 'READY',
                            updatedAt: new Date(),
                            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
                        }
                    })];
            case 2:
                request = _b.sent();
                res.json({
                    success: true,
                    data: request,
                    message: 'Document uploaded successfully'
                });
                return [3 /*break*/, 4];
            case 3:
                error_6 = _b.sent();
                console.error('Upload error:', error_6);
                res.status(500).json({
                    success: false,
                    message: 'Failed to upload document'
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// 4. Get document (customer - after payment)
app.get('/api/download/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, request, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = req.params.id;
                return [4 /*yield*/, database_1.prisma.request.findUnique({
                        where: { id: id },
                        include: {
                            payments: {
                                where: { status: 'PAID' }
                            }
                        }
                    })];
            case 1:
                request = _a.sent();
                if (!request) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Request not found'
                        })];
                }
                if (request.status !== 'COMPLETED') {
                    return [2 /*return*/, res.status(403).json({
                            success: false,
                            message: 'Document not available yet. Please complete payment first.'
                        })];
                }
                if (!request.documentUrl) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Document not found'
                        })];
                }
                // Redirect to Supabase public URL
                res.json({
                    success: true,
                    documentUrl: request.documentUrl
                });
                return [3 /*break*/, 3];
            case 2:
                error_7 = _a.sent();
                console.error('Download error:', error_7);
                res.status(500).json({
                    success: false,
                    message: 'Failed to get document'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// ============================================
// PAYMENT ENDPOINTS (M-Pesa placeholder)
// ============================================
// Initiate payment
app.post('/api/payment/initiate', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var requestId, request, payment, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                requestId = req.body.requestId;
                return [4 /*yield*/, database_1.prisma.request.findUnique({
                        where: { id: requestId }
                    })];
            case 1:
                request = _a.sent();
                if (!request) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Request not found'
                        })];
                }
                if (request.status !== 'READY') {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Document not ready for payment'
                        })];
                }
                return [4 /*yield*/, database_1.prisma.payment.create({
                        data: {
                            requestId: request.id,
                            amount: 250,
                            status: 'PENDING'
                        }
                    })];
            case 2:
                payment = _a.sent();
                // Here you would integrate M-Pesa STK Push
                // For now, just return payment details
                res.json({
                    success: true,
                    data: payment,
                    message: 'Payment initiated. Complete payment to access document.'
                });
                return [3 /*break*/, 4];
            case 3:
                error_8 = _a.sent();
                console.error('Payment initiate error:', error_8);
                res.status(500).json({
                    success: false,
                    message: 'Failed to initiate payment'
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// M-Pesa callback (webhook)
app.post('/api/payment/callback', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, transactionCode, requestId, payment, request, error_9;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                _a = req.body, transactionCode = _a.transactionCode, requestId = _a.requestId;
                return [4 /*yield*/, database_1.prisma.payment.update({
                        where: { requestId: requestId },
                        data: {
                            status: 'PAID',
                            mpesaCode: transactionCode,
                            paidAt: new Date()
                        }
                    })];
            case 1:
                payment = _b.sent();
                return [4 /*yield*/, database_1.prisma.request.update({
                        where: { id: requestId },
                        data: {
                            status: 'COMPLETED',
                            updatedAt: new Date()
                        }
                    })];
            case 2:
                request = _b.sent();
                res.json({
                    success: true,
                    message: 'Payment confirmed, document unlocked'
                });
                return [3 /*break*/, 4];
            case 3:
                error_9 = _b.sent();
                console.error('Payment callback error:', error_9);
                res.status(500).json({
                    success: false,
                    message: 'Failed to process payment callback'
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// ============================================
// START SERVER
// ============================================
app.listen(PORT, function () {
    console.log("\uD83D\uDE80 Server running on http://localhost:".concat(PORT));
    console.log("\uD83D\uDCCA Health check: http://localhost:".concat(PORT, "/health"));
    console.log("\uD83D\uDCC1 Supabase Storage: documents bucket ready");
});
exports.default = app;
