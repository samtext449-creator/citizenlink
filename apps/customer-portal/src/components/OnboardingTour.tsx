// src/components/OnboardingTour.tsx
"use client";

import { useEffect, useRef } from "react";
import { driver, Driver } from "driver.js";
import "driver.js/dist/driver.css";

export default function OnboardingTour({ run, onComplete }: { run: boolean, onComplete: () => void }) {
  const driverRef = useRef<Driver | null>(null);

  useEffect(() => {
    if (!run) return;

    // Helper to wait for elements to exist in DOM
    const waitForElement = (selector: string): Promise<Element | null> => {
      return new Promise((resolve) => {
        if (document.querySelector(selector)) {
          return resolve(document.querySelector(selector));
        }
        const observer = new MutationObserver(() => {
          if (document.querySelector(selector)) {
            observer.disconnect();
            resolve(document.querySelector(selector));
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Timeout after 3 seconds so it doesn't hang forever
        setTimeout(() => {
          observer.disconnect();
          resolve(null);
        }, 3000);
      });
    };

    const startTour = async () => {
      // Wait for the Solara button to exist before starting the tour
      // (Solara is usually the last thing to render)
      await waitForElement('[data-tour="solara"]');

      // If driver already exists, destroy it
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
            element: '[data-tour="nav-overview"]',
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
      driverObj.drive();
    };

    // Small delay to let the CSS transitions finish
    const timer = setTimeout(startTour, 500);

    return () => {
      clearTimeout(timer);
      // Do NOT destroy here, let it live until the user finishes it.
      // If you want to destroy on unmount, call driverRef.current?.destroy() here.
    };
  }, [run, onComplete]);

  return null;
}