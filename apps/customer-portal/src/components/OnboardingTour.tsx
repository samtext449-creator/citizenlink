// components/OnboardingTour.tsx
"use client";

import { useEffect, useRef } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export default function OnboardingTour({ run, onComplete }: { run: boolean; onComplete: () => void }) {
  // Keep a strict reference to the driver instance
  const driverRef = useRef<any>(null);

  useEffect(() => {
    // If the tour isn't supposed to run, do nothing
    if (!run) return;

    // If the tour is already running, don't start a second one
    if (driverRef.current) return;

    // Create the driver instance
    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: false,
      nextBtnText: "Next",
      prevBtnText: "Back",
      doneBtnText: "Got it!",
      onDestroyStarted: () => {
        onComplete();
        localStorage.setItem("taxflow_tour_completed", "true");
        driverObj.destroy();
        driverRef.current = null; // Clear the reference
      },
      steps: [
        {
          element: 'button[data-tour="nav-overview"]',
          popover: {
            title: 'Your Dashboard',
            description: 'Get a quick overview of your active automations, linked accounts, and recent tax filings.',
            side: "right",
            align: 'center',
          }
        },
        {
          element: '[data-tour="welcome"]',
          popover: {
            title: 'Welcome to Taxflow 👋',
            description: 'This is your command center. We keep track of everything so you don\'t have to.',
            side: "bottom",
            align: 'start',
          }
        },
        {
          element: '[data-tour="create-workflow"]',
          popover: {
            title: 'Start Automating',
            description: 'Click here to set up a new tax workflow. You can automate Nil Returns, PAYE, VAT, and more.',
            side: "right",
            align: 'start',
          }
        },
        {
          element: '[data-tour="profile-menu"]',
          popover: {
            title: 'Your Account',
            description: 'Manage your account settings, security, and personal details here.',
            side: "bottom",
            align: 'end',
          }
        },
        {
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

    driverRef.current = driverObj;

    // Wait a small moment to ensure the DOM has fully painted the elements
    const timer = setTimeout(() => {
      driverObj.drive();
    }, 1000);

    return () => {
      clearTimeout(timer);
      // We intentionally DO NOT destroy the driver here. 
      // Let it run its course. If the component completely unmounts (e.g. user navigates away),
      // driver.js will handle the cleanup gracefully without crashing React.
    };
  }, [run, onComplete]);

  return null;
}