import { useLocation, Switch, Route, Router as WouterRouter } from "wouter";
import { AnimatePresence, MotionConfig } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import SplashScreen from "@/pages/splash";
import OnboardingScreen from "@/pages/onboarding";
import HomeScreen from "@/pages/home";
import GetStartedScreen from "@/pages/get-started";
import SettingsScreen from "@/pages/settings";
import CreateSplitScreen from "@/pages/create-split";
import GroupDashboardScreen from "@/pages/group-dashboard";
import AddExpenseScreen from "@/pages/add-expense";
import ExpenseDetailScreen from "@/pages/expense-detail";
import SettlementScreen from "@/pages/settlement";
import ActivityLogScreen from "@/pages/activity-log";
import InsightsScreen from "@/pages/insights";
import GroupSettingsScreen from "@/pages/group-settings";
import JoinScreen from "@/pages/join";
import PrivacyPolicyScreen from "@/pages/privacy-policy";
import NotFound from "@/pages/not-found";
import { useSyncEngine } from "@/lib/sync-engine";

function AnimatedRoutes() {
  const [location] = useLocation();
  return (
    <div className="h-full">
    <AnimatePresence mode="wait">
      <Switch key={location} location={location}>
        <Route path="/" component={SplashScreen} />
        <Route path="/onboarding" component={OnboardingScreen} />
        <Route path="/home" component={HomeScreen} />
        <Route path="/get-started" component={GetStartedScreen} />
        <Route path="/settings" component={SettingsScreen} />
        <Route path="/create-split" component={CreateSplitScreen} />
        <Route path="/group/:id">
          {(params) => <GroupDashboardScreen params={params as { id: string }} />}
        </Route>
        <Route path="/group/:id/add-expense">
          {(params) => <AddExpenseScreen params={params as { id: string }} />}
        </Route>
        <Route path="/group/:id/expense/:expenseId">
          {(params) => <ExpenseDetailScreen params={params as { id: string; expenseId: string }} />}
        </Route>
        <Route path="/group/:id/settle">
          {(params) => <SettlementScreen params={params as { id: string }} />}
        </Route>
        <Route path="/group/:id/activity">
          {(params) => <ActivityLogScreen params={params as { id: string }} />}
        </Route>
        <Route path="/group/:id/insights">
          {(params) => <InsightsScreen params={params as { id: string }} />}
        </Route>
        <Route path="/group/:id/settings">
          {(params) => <GroupSettingsScreen params={params as { id: string }} />}
        </Route>
        <Route path="/join">
          {() => <JoinScreen params={{ code: "" }} />}
        </Route>
        <Route path="/join/:code">
          {(params) => <JoinScreen params={params as { code: string }} />}
        </Route>
        <Route path="/privacy-policy" component={PrivacyPolicyScreen} />
        <Route component={NotFound} />
      </Switch>
    </AnimatePresence>
    </div>
  );
}

import { SuccessOverlay } from "@/components/ui/success-overlay";

function App() {
  useSyncEngine();
  
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <TooltipProvider>
          {/* Outer shell: soft lavender tint surrounds the phone frame on desktop; full screen on mobile */}
          <div className="h-full w-full flex justify-center bg-[hsl(240,30%,95%)] dark:bg-[hsl(240,25%,6%)]">
            <div className="relative w-full sm:max-w-[430px] h-full bg-background shadow-[0_0_80px_rgba(0,0,0,0.08)] overflow-hidden">
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <AnimatedRoutes />
              </WouterRouter>
              <SuccessOverlay />
            </div>
          </div>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </MotionConfig>
  );
}

export default App;
