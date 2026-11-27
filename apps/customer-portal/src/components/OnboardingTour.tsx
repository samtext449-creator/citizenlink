// components/OnboardingTour.tsx
"use client";

import { useEffect, useRef } from "react";
import { driver, Driver } from "driver.js";
import "driver.js/dist/driver.css";

export default function OnboardingTour({ run, onComplete }: { run: boolean, onComplete: () => void }) {
  // Keep a reference to the driver instance so React doesn't destroy it early
  const driverRef = useRef<Driver | null>(null);

  useEffect(() => {
    if (!run) return;

    // If a previous instance exists, destroy it first
    if (driverRef.current) {
      driverRef.current.destroy();
    }

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

    // Increased delay to 800ms to ensure the page and data-tour elements are fully rendered
    const timer = setTimeout(() => {
      driverObj.drive();
    }, 800);

    return () => {
      clearTimeout(timer);
      // DO NOT call driverObj.destroy() here. 
      // In React Strict Mode, this cleanup runs immediately, which causes the pop-and-disappear.
      // We let the tour live until the user closes it.
    };
  }, [run, onComplete]);

  return null;
}