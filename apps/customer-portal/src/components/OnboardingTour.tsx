// src/components/OnboardingTour.tsx
"use client";

import { useEffect, useRef } from "react";
import { driver, Driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

// Every step points at a data-tour attribute in the dashboard.
// Steps whose element is missing or off screen (for example the sidebar on a
// phone, or the profile banner once the profile is approved) are skipped.
const ALL_STEPS: DriveStep[] = [
  // ---- Welcome ----
  {
    element: '[data-tour="welcome"]',
    popover: {
      title: "Welcome to Taxflow 👋",
      description:
        "This is your command center. We keep track of your tax activity so you don't have to. Let's take a quick look around.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="profile-banner"]',
    popover: {
      title: "Finish your profile first",
      description:
        "Automation starts once your profile is complete and approved. This banner shows where you are, and the button takes you to the form.",
      side: "bottom",
      align: "center",
    },
  },

  // ---- Sidebar ----
  {
    element: '[data-tour="nav-overview"]',
    popover: {
      title: "Overview",
      description:
        "Home base. See your automations, linked accounts and recent filings at a glance.",
      side: "right",
      align: "center",
    },
  },
  {
    element: '[data-tour="nav-workflows"]',
    popover: {
      title: "Workflows",
      description:
        "Set up and manage your tax automations here, such as nil returns, PAYE and VAT.",
      side: "right",
      align: "center",
    },
  },
  {
    element: '[data-tour="nav-my-tax-profile"]',
    popover: {
      title: "My Tax Profile",
      description:
        "Your tax card report, obligations and compliance status in one place. You can print it too.",
      side: "right",
      align: "center",
    },
  },
  {
    element: '[data-tour="nav-kra-verification"]',
    popover: {
      title: "KRA Verification",
      description:
        "Check a KRA PIN, confirm obligations and verify certificates before you rely on them.",
      side: "right",
      align: "center",
    },
  },
  {
    element: '[data-tour="nav-my-submissions"]',
    popover: {
      title: "My Submissions",
      description:
        "Track every filing: when it was prepared, when it went in, and whether it needs your attention.",
      side: "right",
      align: "center",
    },
  },
  {
    element: '[data-tour="nav-linked-accounts"]',
    popover: {
      title: "Linked Accounts",
      description:
        "Connect and manage the KRA accounts that Taxflow files for.",
      side: "right",
      align: "center",
    },
  },
  {
    element: '[data-tour="nav-my-subscription"]',
    popover: {
      title: "My Subscription",
      description:
        "See your plan, renew it, and manage billing.",
      side: "right",
      align: "center",
    },
  },
  {
    element: '[data-tour="nav-profile"]',
    popover: {
      title: "Profile",
      description:
        "Update your personal details and security settings.",
      side: "right",
      align: "center",
    },
  },
  {
    element: '[data-tour="nav-help-support"]',
    popover: {
      title: "Help & Support",
      description:
        "Answers to common questions, plus email and WhatsApp when you need a person.",
      side: "right",
      align: "center",
    },
  },
  {
    element: '[data-tour="collapse-sidebar"]',
    popover: {
      title: "More room when you need it",
      description:
        "Collapse the menu to icons only for a wider workspace. Click again to bring it back.",
      side: "right",
      align: "start",
    },
  },

  // ---- Top bar ----
  {
    element: '[data-tour="account-type"]',
    popover: {
      title: "Account type",
      description:
        "Taxflow currently supports individual taxpayer accounts, and this shows which one you're using.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="reset-tour"]',
    popover: {
      title: "Want to see this again?",
      description:
        "You can replay this tour any time with the Reset Tour button.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="notifications"]',
    popover: {
      title: "Notifications",
      description:
        "Filing updates and anything that needs your attention will show up here. The red dot means something new.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: '[data-tour="profile-menu"]',
    popover: {
      title: "Your Account",
      description:
        "Open this menu for your profile, account settings and security.",
      side: "bottom",
      align: "end",
    },
  },

  // ---- Dashboard content ----
  {
    element: '[data-tour="stats"]',
    popover: {
      title: "Your numbers",
      description:
        "Active automations, linked KRA accounts and total submissions. They update as you use Taxflow.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: '[data-tour="stat-linked"]',
    popover: {
      title: "Link a KRA account",
      description:
        "No account linked yet? Use the Link Account button on this card to connect one.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: '[data-tour="quick-actions"]',
    popover: {
      title: "Quick Actions",
      description:
        "Shortcuts to the things you'll do most: create a workflow, link an account, check filings and renew.",
      side: "top",
      align: "center",
    },
  },
  {
    element: '[data-tour="create-workflow"]',
    popover: {
      title: "Start Automating",
      description:
        "Click here to set up a new tax workflow. You can automate nil returns, PAYE, VAT and more.",
      side: "top",
      align: "start",
    },
  },
  {
    element: '[data-tour="submissions"]',
    popover: {
      title: "Recent Submissions",
      description:
        "Your latest filings appear here with their status: Completed, Processing, Pending or Action Required.",
      side: "top",
      align: "center",
    },
  },
  {
    element: '[data-tour="submission-filters"]',
    popover: {
      title: "Find a filing fast",
      description:
        "Search by reference, or filter by type, status and date. Reset clears everything.",
      side: "bottom",
      align: "center",
    },
  },

  // ---- Wrap up ----
  {
    element: '[data-tour="sign-out"]',
    popover: {
      title: "Sign out",
      description:
        "Done for the day? Sign out here. For your safety we also sign you out after a period of inactivity.",
      side: "right",
      align: "end",
    },
  },
  {
    element: '[data-tour="solara"]',
    popover: {
      title: "Meet Solara AI 🤖",
      description:
        "Stuck, or not sure where something is? Ask Solara. It can take you to the right page, and it follows you around Taxflow.",
      side: "left",
      align: "center",
    },
  },
];

function isVisible(selector: string): boolean {
  const el = document.querySelector(selector);
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.right > 0 && r.left < window.innerWidth;
}

export default function OnboardingTour({
  run,
  onComplete,
}: {
  run: boolean;
  onComplete: () => void;
}) {
  const driverRef = useRef<Driver | null>(null);

  // Keep the latest onComplete without restarting the tour when the parent re-renders
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!run) return;

    // Wait for an element to exist in the DOM
    const waitForElement = (selector: string): Promise<Element | null> =>
      new Promise((resolve) => {
        const found = document.querySelector(selector);
        if (found) return resolve(found);

        const observer = new MutationObserver(() => {
          const el = document.querySelector(selector);
          if (el) {
            observer.disconnect();
            resolve(el);
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });

        // Give up after 3 seconds so it never hangs
        setTimeout(() => {
          observer.disconnect();
          resolve(null);
        }, 3000);
      });

    const startTour = async () => {
      // Solara is usually the last thing to render
      await waitForElement('[data-tour="solara"]');

      if (driverRef.current) driverRef.current.destroy();

      // Only keep steps that can actually be shown right now
      const steps = ALL_STEPS.filter((s) =>
        typeof s.element === "string" ? isVisible(s.element) : true
      );
      if (steps.length === 0) {
        onCompleteRef.current();
        return;
      }

      const driverObj = driver({
        showProgress: true,
        animate: true,
        allowClose: false,
        smoothScroll: true,
        nextBtnText: "Next",
        prevBtnText: "Back",
        doneBtnText: "Got it!",
        
        // Inject the custom "Skip Tour" button
        onPopoverRender: (popover) => {
          // Create the skip button
          const skipBtn = document.createElement("button");
          skipBtn.innerText = "Skip Tour";
          skipBtn.className = "text-xs font-semibold text-slate-500 hover:text-slate-800 hover:underline transition-all cursor-pointer";
          
          // Action when clicked
          skipBtn.addEventListener("click", () => {
            onCompleteRef.current();
            localStorage.setItem("taxflow_tour_completed", "true");
            driverObj.destroy();
          });

          // Hide the default X icon
          const closeBtn = popover.wrapper.querySelector('.driver-popover-close-btn');
          if (closeBtn) {
             (closeBtn as HTMLElement).style.display = 'none';
          }

          // Add the skip button to the title wrapper
          const header = popover.wrapper.querySelector('.driver-popover-title');
          if (header && header.parentElement) {
            header.parentElement.style.display = "flex";
            header.parentElement.style.justifyContent = "space-between";
            header.parentElement.style.alignItems = "center";
            header.parentElement.appendChild(skipBtn);
          }
        },

        onDestroyStarted: () => {
          onCompleteRef.current();
          localStorage.setItem("taxflow_tour_completed", "true");
          driverObj.destroy();
        },
        steps,
      });

      driverRef.current = driverObj;
      driverObj.drive();
    };

    // Small delay to let the CSS transitions finish
    const timer = setTimeout(startTour, 500);

    return () => {
      clearTimeout(timer);
      // Don't destroy here: let the tour live until the user finishes it.
    };
  }, [run]);

  return null;
}