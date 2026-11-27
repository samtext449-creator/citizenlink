// components/OnboardingTour.tsx
"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export default function OnboardingTour({ run, onComplete }: { run: boolean, onComplete: () => void }) {
  useEffect(() => {
    if (!run) return;

    const driverObj = driver({
      showProgress: true, // Shows "1 of 4" at the bottom
      animate: true,
      allowClose: false, // Forces them to click through
      nextBtnText: "Next",
      prevBtnText: "Back",
      doneBtnText: "Got it!",
      onDestroyStarted: () => {
        // Triggered when they finish or skip
        onComplete();
        // Save to localStorage so they don't see it again on refresh
        localStorage.setItem("taxflow_tour_completed", "true");
        driverObj.destroy();
      },
      steps: [
        {
          // 1. Sidebar Overview
          element: 'button[data-tour="nav-overview"]',
          popover: {
            title: 'Your Dashboard',
            description: 'Get a quick overview of your active automations, linked accounts, and recent tax filings.',
            side: "right",
            align: 'center',
          }
        },
        {
          // 2. The Welcome Banner
          element: '[data-tour="welcome"]',
          popover: {
            title: 'Welcome to Taxflow 👋',
            description: 'This is your command center. We keep track of everything so you don\'t have to.',
            side: "bottom",
            align: 'start',
          }
        },
        {
          // 3. The Quick Action
          element: '[data-tour="create-workflow"]',
          popover: {
            title: 'Start Automating',
            description: 'Click here to set up a new tax workflow. You can automate Nil Returns, PAYE, VAT, and more.',
            side: "right",
            align: 'start',
          }
        },
        {
          // 4. The User Profile
          element: '[data-tour="profile-menu"]',
          popover: {
            title: 'Your Account',
            description: 'Manage your account settings, security, and personal details here.',
            side: "bottom",
            align: 'end',
          }
        },
        {
          // 5. Solara AI
          element: '[data-tour="solara"]',
          popover: {
            title: 'Meet Solara AI 🤖',
            description: 'Have a tax question? Click here to ask Solara. It knows the Kenyan tax system inside and out.',
            side: "left",
            align: 'center',
          }
        }
      ]
    });

    // Small delay to ensure the page is fully loaded before highlighting
    setTimeout(() => {
      driverObj.drive();
    }, 500);

    return () => driverObj.destroy();
  }, [run, onComplete]);

  return null;
}