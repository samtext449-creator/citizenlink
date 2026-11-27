"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Bell,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  CreditCard,
  FileCheck2,
  FileText,
  FolderOpen,
  House,
  Link2,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  ShieldCheck,
  UserRound,
  Workflow,
  X,
  User,
  Filter,
  Search,
  TrendingUp,
  RefreshCw // Added for the reset button
} from "lucide-react";
import MySubscriptionPage from "./MySubscription";
import WorkflowsPage from "./Workflows";
import MyTaxProfilePage from "./MyTaxProfile";
import KRAVerificationPage from "./KRAVerification";
import SubmissionsPage from "./Submissions";
import LinkedAccountsPage from "./LinkedAccounts";
import ProfilePage from "./Profile";
import HelpSupportPage from "./HelpSupport";
import SolaraAgent from "./SolaraAgent"; 
import OnboardingTour from "../../components/OnboardingTour"; 

// --------------------------------------------------
// Navigation configuration
// --------------------------------------------------
const navigation = [
  { name: "Overview", icon: House },
  { name: "Workflows", icon: Workflow },
  { name: "My Tax Profile", icon: FileText },
  { name: "KRA Verification", icon: BadgeCheck },
  { name: "My Submissions", icon: FileCheck2 },
  { name: "Linked Accounts", icon: Link2 },
  { name: "My Subscription", icon: CreditCard },
  { name: "Profile", icon: UserRound },
  { name: "Help & Support", icon: CircleHelp },
];

// --------------------------------------------------
// Sample dashboard data
// --------------------------------------------------
const stats = [
  {
    title: "Active Automations",
    value: "00",
    description: "Tax processes set up with TaxFlow",
    icon: Workflow,
    color: "bg-blue-50 text-blue-700",
    trend: "No changes this month",
  },
  {
    title: "KRA Linked Accounts",
    value: "00",
    description: "Connected accounts",
    icon: Link2,
    color: "bg-indigo-50 text-indigo-700",
    trend: "No accounts linked",
  },
  {
    title: "Submissions",
    value: "00",
    description: "Total submitted applications",
    icon: FileCheck2,
    color: "bg-violet-50 text-violet-700",
    trend: "0% this month",
  },
];

const linkedAccounts: any[] = [];
const submissions: any[] = [];

// --------------------------------------------------
// Main dashboard page
// --------------------------------------------------
export default function DashboardPage() {
  const router = useRouter();

  const [activePage, setActivePage] = useState("Overview");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // --- TOUR STATE ---
  const [runTour, setRunTour] = useState(false);

  // Real User State
  const [user, setUser] = useState<any>(null);

  const profileStatus = user?.profile_status ?? "incomplete";
  const showProfileBanner = !!user && profileStatus !== "approved";

  // Session expiry warning
  const WARNING_MS = 2 * 60 * 1000; 
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [showExpiry, setShowExpiry] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [extending, setExtending] = useState(false);

  const currentAccount = "Individual Account";

  // 1. Fetch real user data on mount
  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");

        if (res.status === 401) {
          router.replace("/login");
          return;
        }

        const data = await res.json();

        if (data.success && data.data && isMounted) {
          setUser(data.data);
          if (data.data.session_expires_at) {
            setExpiresAt(new Date(data.data.session_expires_at).getTime());
          }
        }
      } catch (error) {
        console.error("Failed to fetch user session:", error);
      } finally {
        if (isMounted) setTimeout(() => setIsLoading(false), 800);
      }
    };

    fetchUser();

    return () => {
      isMounted = false; 
    };
  }, [router]);

  // 2. Separate Effect to trigger the tour safely
  useEffect(() => {
    // Only trigger when loading is finished and we are on Overview
    if (!isLoading && activePage === "Overview") {
      const hasSeenTour = localStorage.getItem("taxflow_tour_completed");
      
      if (!hasSeenTour) {
        // Give the DOM 1.5 seconds to render all the data-tour elements
        const timer = setTimeout(() => {
          setRunTour(true);
        }, 1500);

        return () => clearTimeout(timer);
      }
    }
  }, [isLoading, activePage]);

  // Watch the session clock
  useEffect(() => {
    if (!expiresAt) return;

    const tick = () => {
      const left = expiresAt - Date.now();
      if (left <= 0) {
        setShowExpiry(false);
        handleSignOut();
        return;
      }
      setSecondsLeft(Math.ceil(left / 1000));
      setShowExpiry(left <= WARNING_MS);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  async function handleContinueSession() {
    setExtending(true);
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      if (!res.ok) {
        await handleSignOut();
        return;
      }
      const data = await res.json();
      if (data?.data?.session_expires_at) {
        setExpiresAt(new Date(data.data.session_expires_at).getTime());
      }
      setShowExpiry(false);
    } catch {
      await handleSignOut();
    } finally {
      setExtending(false);
    }
  }

  function handleNavigation(name: string) {
    setActivePage(name);
    setMobileOpen(false);
    setProfileOpen(false);
    setNotificationsOpen(false);
  }

  async function handleSignOut() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  // Helper for testing the tour
  const resetTour = () => {
    localStorage.removeItem("taxflow_tour_completed");
    setRunTour(false);
    setTimeout(() => setRunTour(true), 100);
  };

  const fullName =
    user?.full_name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(" ");

  const displayName =
    fullName ||
    user?.business_name ||
    user?.email?.split("@")[0] ||
    "User";
  const userInitial = displayName.charAt(0).toUpperCase();
  const userEmail = user?.email || "user@example.com";
  const userIdString = user?.merchant_id
    ? `ID: ${user.merchant_id}`
    : currentAccount;

  return (
    <div className="min-h-screen bg-[#F7F9F8] text-slate-800">
      {/* RENDER TOUR COMPONENT */}
      {!isLoading && <OnboardingTour run={runTour} onComplete={() => setRunTour(false)} />}

      {/* Session expiry pop-up */}
      {showExpiry && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-700">
              <Clock3 size={24} />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Your session is about to end
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Do you want to continue? You will be signed out in
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">
              {String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:
              {String(secondsLeft % 60).padStart(2, "0")}
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSignOut}
                disabled={extending}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                No, sign out
              </button>
              <button
                onClick={handleContinueSession}
                disabled={extending}
                className="flex-1 rounded-xl bg-[#0B1B36] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {extending ? "Please wait…" : "Yes, stay signed in"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col
          border-r border-slate-200 bg-white
          transition-all duration-300
          ${collapsed ? "w-[76px]" : "w-[260px]"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-5">
          <div className="flex items-center gap-3 overflow-hidden">
            {!collapsed && (
              <div>
                <h1 className="text-xl font-bold tracking-tight text-[#0B1B36]">
                  Taxflow<span className="text-blue-600">.</span>
                </h1>
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  Tax Automation
                </p>
              </div>
            )}

            {collapsed && (
              <div className="mx-auto text-xl font-bold tracking-tight text-[#0B1B36]">
                T<span className="text-blue-600">.</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            data-tour="collapse-sidebar"
            className="hidden rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:block"
          >
            {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
          </button>

          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-6">
          {!collapsed && (
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
              Main Menu
            </p>
          )}

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = activePage === item.name;
              const tourId = `nav-${item.name.toLowerCase().replace(/\s+/g, "-")}`;

              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.name)}
                  data-tour={tourId} 
                  className={`
                    group flex w-full items-center gap-3 rounded-xl
                    px-3 py-3 text-sm font-medium transition-all
                    ${
                      active
                        ? "bg-[#0B1B36] text-white shadow-sm shadow-[#0B1B36]/10"
                        : "text-slate-500 hover:bg-blue-50 hover:text-[#0B1B36]"
                    }
                    ${collapsed ? "justify-center" : ""}
                  `}
                >
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.3 : 1.8}
                    className="shrink-0"
                  />
                  {!collapsed && (
                    <span className="whitespace-nowrap">{item.name}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-100 p-3">
          <button
            onClick={handleSignOut}
            data-tour="sign-out"
            className={`
              flex w-full items-center gap-3 rounded-xl px-3 py-3
              text-sm font-medium text-red-600 transition
              hover:bg-red-50
              ${collapsed ? "justify-center" : ""}
            `}
          >
            <LogOut size={20} className="shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main content wrapper */}
      <div
        className={`
          min-h-screen transition-all duration-300
          ${collapsed ? "lg:ml-[76px]" : "lg:ml-[260px]"}
        `}
      >
        {showProfileBanner && (
          <div
            role="alert"
            data-tour="profile-banner"
            className={`flex h-9 items-center justify-center gap-3 border-b px-4 ${
              profileStatus === "pending_approval"
                ? "border-blue-200 bg-blue-50"
                : "border-yellow-300 bg-yellow-100"
            }`}
          >
            {profileStatus === "pending_approval" ? (
              <>
                <Clock3 size={17} className="shrink-0 text-blue-700" />
                <p className="truncate text-[13px] font-semibold text-blue-900">
                  Your application is in the approval stage. Taxflow will
                  approve it shortly.
                </p>
              </>
            ) : (
              <>
                <AlertCircle size={17} className="shrink-0 text-yellow-700" />
                <p className="truncate text-[13px] font-semibold text-yellow-900">
                  To start your journey of automation, complete your profile
                </p>
                <button
                  onClick={() => router.push("/self-declaration")}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md bg-yellow-400 px-3 py-0.5 text-[13px] font-semibold text-yellow-950 transition hover:bg-yellow-500"
                >
                  Complete Profile
                  <ArrowRight size={13} />
                </button>
              </>
            )}
          </div>
        )}

        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-7">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu size={22} />
            </button>

            <div data-tour="account-type" className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm">
              <User size={16} className="text-slate-700" />
              <span>Individual</span>
            </div>

            <button 
              onClick={resetTour} 
              data-tour="reset-tour"
              className="hidden lg:flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
            >
              <RefreshCw size={14} /> Reset Tour
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setProfileOpen(false);
                }}
                data-tour="notifications"
                className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100"
                aria-label="Notifications"
              >
                <Bell size={21} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-14 z-50 w-[300px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:w-[340px]">
                  <div className="flex items-center justify-between border-b border-slate-100 p-4">
                    <h3 className="font-semibold text-slate-900">
                      Notifications
                    </h3>
                    <span className="text-xs text-blue-700">0 new</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    <div className="p-6 text-center text-sm text-slate-400">
                      No new notifications
                    </div>
                  </div>

                  <button className="w-full border-t border-slate-100 p-3 text-sm font-medium text-blue-700 hover:bg-blue-50">
                    View all notifications
                  </button>
                </div>
              )}
            </div>

            {/* Profile (TOUR HOOK) */}
            <div className="relative" data-tour="profile-menu">
              <button
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setNotificationsOpen(false);
                }}
                className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-100 sm:gap-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-900 uppercase">
                  {userInitial}
                </div>

                <div className="hidden text-left sm:block">
                  <p className="text-sm font-semibold text-slate-800 truncate max-w-[120px]">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate max-w-[120px]">
                    {userIdString}
                  </p>
                </div>

                <ChevronDown
                  size={16}
                  className="hidden text-slate-400 sm:block"
                />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-14 z-50 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                  <div className="border-b border-slate-100 px-3 py-3">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {userEmail}
                    </p>
                  </div>

                  <ProfileMenuItem
                    icon={UserRound}
                    label="My Profile"
                    onClick={() => handleNavigation("Profile")}
                  />
                  <ProfileMenuItem
                    icon={Settings}
                    label="Account Settings"
                    onClick={() => handleNavigation("Profile")}
                  />
                  <ProfileMenuItem
                    icon={ShieldCheck}
                    label="Security"
                    onClick={() => handleNavigation("Profile")}
                  />
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] p-4 sm:p-7 lg:p-8">
          {isLoading ? (
            <DashboardSkeleton />
          ) : activePage === "Overview" ? (
            <DashboardHome onNavigate={handleNavigation} user={user} />
          ) : activePage === "Workflows" ? (
            <WorkflowsPage
              onGoToPricing={() => handleNavigation("My Subscription")}
            />
          ) : activePage === "My Tax Profile" ? (
            <MyTaxProfilePage onNavigate={handleNavigation} />
          ) : activePage === "KRA Verification" ? (
            <KRAVerificationPage />
          ) : activePage === "My Submissions" ? (
            <SubmissionsPage
              onGoToPricing={() => handleNavigation("My Subscription")}
            />
          ) : activePage === "Linked Accounts" ? (
            <LinkedAccountsPage />
          ) : activePage === "My Subscription" ? (
            <MySubscriptionPage />
          ) : activePage === "Profile" ? (
            <ProfilePage />
          ) : activePage === "Help & Support" ? (
            <HelpSupportPage />
          ) : (
            <SectionPlaceholder
              title={activePage}
              onBack={() => handleNavigation("Overview")}
            />
          )}
        </main>

        <footer className="border-t border-slate-200 px-7 py-5">
          <div className="flex flex-col items-center justify-between gap-2 text-xs text-slate-400 sm:flex-row">
            <p>© 2026 Taxflow. All rights reserved.</p>
            <p>Tax Automation Platform</p>
          </div>
        </footer>
      </div>

      {/* Solara AI Agent (TOUR HOOK) */}
      {!isLoading && activePage !== "Workflows" && (
        <div data-tour="solara">
          <SolaraAgent
            activePage={activePage}
            onNavigate={handleNavigation}
            userName={user?.first_name || user?.business_name}
          />
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------
// Dashboard home content
// --------------------------------------------------
function DashboardHome({
  onNavigate,
  user,
}: {
  onNavigate: (page: string) => void;
  user: any;
}) {
  const [openAccountCard, setOpenAccountCard] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(
    linkedAccounts[0] || { name: "No Account", pin: "" }
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDate, setFilterDate] = useState("");

  const submissionTypes = useMemo(
    () => ["All", ...Array.from(new Set(submissions.map((s) => s.type)))],
    []
  );

  const statusOptions = [
    "All",
    "Completed",
    "Processing",
    "Pending",
    "Action Required",
  ];

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        s.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.type.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = filterType === "All" || s.type === filterType;
      const matchesStatus = filterStatus === "All" || s.status === filterStatus;

      const matchesDate =
        filterDate === "" ||
        s.submittedAt.startsWith(
          new Date(filterDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        ) ||
        s.preparedAt.startsWith(
          new Date(filterDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        );

      return matchesSearch && matchesType && matchesStatus && matchesDate;
    });
  }, [searchQuery, filterType, filterStatus, filterDate]);

  function resetFilters() {
    setSearchQuery("");
    setFilterType("All");
    setFilterStatus("All");
    setFilterDate("");
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* Welcome (TOUR HOOK) */}
      <section data-tour="welcome">
        <p className="text-sm font-medium text-blue-700">{today}</p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Welcome back, {user?.first_name || user?.business_name || "there"}!
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Here's an overview of your tax activities and automations.
        </p>
      </section>

      <section data-tour="stats" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isLinkedAccounts = stat.title === "KRA Linked Accounts";

          return (
            <div
              key={stat.title}
              data-tour={isLinkedAccounts ? "stat-linked" : undefined}
              className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className={`rounded-xl p-3 ${stat.color}`}>
                  <Icon size={22} />
                </div>

                {isLinkedAccounts ? (
                  linkedAccounts.length > 0 ? (
                    <div className="relative">
                      <button
                        onClick={() => setOpenAccountCard(!openAccountCard)}
                        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        <span className="max-w-[120px] truncate">
                          {selectedAccount.name}
                        </span>
                        <ChevronDown
                          size={14}
                          className={`transition-transform ${
                            openAccountCard ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {openAccountCard && (
                        <div className="absolute right-0 top-9 z-20 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Linked KRA Accounts
                          </p>
                          {linkedAccounts.map((acc) => (
                            <button
                              key={acc.pin}
                              onClick={() => {
                                setSelectedAccount(acc);
                                setOpenAccountCard(false);
                              }}
                              className={`flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left text-xs transition ${
                                selectedAccount.pin === acc.pin
                                  ? "bg-blue-50 text-blue-900"
                                  : "text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              <span className="font-semibold">{acc.name}</span>
                              <span className="text-[11px] text-slate-400">
                                {acc.pin}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => onNavigate("Linked Accounts")}
                      className="flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-slate-100"
                    >
                      <Plus size={12} /> Link Account
                    </button>
                  )
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                    <TrendingUp size={12} className="opacity-70" />
                    {stat.trend}
                  </span>
                )}
              </div>

              <h3 className="mt-5 text-3xl font-bold text-slate-900">
                {stat.value}
              </h3>

              <p className="mt-1 text-sm font-medium text-slate-700">
                {stat.title}
              </p>

              <p className="mt-1 text-xs text-slate-400">{stat.description}</p>
            </div>
          );
        })}
      </section>

      <section data-tour="quick-actions" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="font-bold text-slate-900">Quick Actions</h3>
        <p className="mt-1 text-xs text-slate-400">Common tasks in Taxflow</p>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          
          <div data-tour="create-workflow">
            <QuickAction
              icon={Plus}
              title="Create Workflow"
              description="Set up a new tax automation"
              onClick={() => onNavigate("Workflows")}
            />
          </div>

          <QuickAction
            icon={Link2}
            title="Link KRA Account"
            description="Connect a taxpayer account"
            onClick={() => onNavigate("Linked Accounts")}
          />
          <QuickAction
            icon={FileCheck2}
            title="My Submissions"
            description="Track your tax filings"
            onClick={() => onNavigate("My Submissions")}
          />
          <QuickAction
            icon={CreditCard}
            title="Renew Subscription"
            description="Manage your plan & billing"
            onClick={() => onNavigate("My Subscription")}
          />
        </div>
      </section>

      <section data-tour="submissions" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-bold text-slate-900">Recent Submissions</h3>
            <p className="mt-1 text-xs text-slate-400">
              Filter and track your recent tax filings
            </p>
          </div>

          {submissions.length > 0 && (
            <button
              onClick={() => onNavigate("My Submissions")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline"
            >
              View all
              <ArrowRight size={14} />
            </button>
          )}
        </div>

        <div data-tour="submission-filters" className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference or type…"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-700 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              {submissionTypes.map((t) => (
                <option key={t} value={t}>
                  {t === "All" ? "All Types" : t}
                </option>
              ))}
            </select>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s === "All" ? "All Statuses" : s}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />

          <button
            onClick={resetFilters}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Reset
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Prepared At</th>
                <th className="px-5 py-3">Submitted At</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="rounded-full bg-slate-50 p-4 mb-4">
                        <FileCheck2 className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-900 mb-1">
                        No submissions yet
                      </p>
                      <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
                        You haven't made any submissions yet. Once you complete
                        a workflow, your filings will appear here.
                      </p>
                      <button
                        onClick={() => onNavigate("Workflows")}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-800"
                      >
                        <Plus size={14} />
                        Create Workflow
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((s) => (
                  <tr
                    key={s.reference}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-800">
                        {s.type}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {s.reference}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">
                      {s.preparedAt}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">
                      {s.submittedAt}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${s.color}`}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400">
          <span>
            Showing {filteredSubmissions.length} of {submissions.length}{" "}
            submissions
          </span>
        </div>
      </section>
    </div>
  );
}

// --------------------------------------------------
// Loading Skeleton Component
// --------------------------------------------------
function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <section>
        <div className="h-4 w-48 bg-slate-200 rounded mb-3"></div>
        <div className="h-8 w-64 bg-slate-200 rounded mb-3"></div>
        <div className="h-4 w-96 bg-slate-200 rounded"></div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white p-5 h-40 flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <div className="h-12 w-12 rounded-xl bg-slate-100"></div>
              <div className="h-4 w-20 rounded bg-slate-100"></div>
            </div>
            <div>
              <div className="h-8 w-16 bg-slate-200 rounded mb-2"></div>
              <div className="h-4 w-32 bg-slate-100 rounded mb-1"></div>
              <div className="h-3 w-48 bg-slate-50 rounded"></div>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-5 w-32 bg-slate-200 rounded mb-2"></div>
        <div className="h-4 w-48 bg-slate-100 rounded mb-6"></div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 rounded-xl border border-slate-100 bg-slate-50/50 p-3 flex items-center gap-3"
            >
              <div className="h-10 w-10 rounded-lg bg-slate-200"></div>
              <div className="flex-1">
                <div className="h-4 w-24 bg-slate-200 rounded mb-2"></div>
                <div className="h-3 w-32 bg-slate-100 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-5 border-b border-slate-100">
          <div className="h-5 w-40 bg-slate-200 rounded mb-2"></div>
          <div className="h-4 w-64 bg-slate-100 rounded"></div>
        </div>
        <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex gap-3">
          <div className="h-9 flex-1 bg-slate-200 rounded-lg"></div>
          <div className="h-9 w-24 bg-slate-200 rounded-lg"></div>
          <div className="h-9 w-24 bg-slate-200 rounded-lg"></div>
          <div className="h-9 w-32 bg-slate-200 rounded-lg"></div>
        </div>
        <div className="p-5 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex justify-between items-center py-3 border-b border-slate-50"
            >
              <div className="flex-1">
                <div className="h-4 w-32 bg-slate-200 rounded mb-2"></div>
                <div className="h-3 w-20 bg-slate-100 rounded"></div>
              </div>
              <div className="flex-1">
                <div className="h-4 w-24 bg-slate-100 rounded"></div>
              </div>
              <div className="flex-1">
                <div className="h-4 w-24 bg-slate-100 rounded"></div>
              </div>
              <div className="flex-1 flex justify-end">
                <div className="h-6 w-20 bg-slate-100 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// --------------------------------------------------
// Reusable components
// --------------------------------------------------
function ProfileMenuItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-[#0B1B36]"
    >
      <Icon size={17} />
      {label}
    </button>
  );
}

function QuickAction({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/50 h-full"
    >
      <div className="rounded-lg bg-blue-50 p-2.5 text-blue-700">
        <Icon size={19} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      </div>
      <ArrowRight size={16} className="text-slate-300" />
    </button>
  );
}

function SectionPlaceholder({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
      <div className="rounded-2xl bg-blue-50 p-5 text-blue-700">
        <FolderOpen size={32} />
      </div>
      <h2 className="mt-5 text-xl font-bold text-slate-900">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
        This section is part of the Taxflow dashboard structure. Its dedicated
        interface and functionality can be developed next.
      </p>
      <button
        onClick={onBack}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0B1B36] px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        <ArrowRight size={17} className="rotate-180" />
        Back to Overview
      </button>
    </div>
  );
}