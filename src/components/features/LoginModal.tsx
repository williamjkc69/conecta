"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import {
  BUTTONS,
  TITLES,
  MESSAGES,
  TABS,
  PLACEHOLDERS,
  LABELS,
  LINKS
} from "@/constants/text";
import { ROUTES, API_ROUTES } from "@/constants/routes";
import { ROLES } from "@/constants/roles";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "company" | "candidate" | "admin";
  initialEmail?: string;
  jobId?: string;
  token?: string;
}

const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  type,
  initialEmail,
  jobId,
  token
}) => {
  const { signIn, signUp } = useAuthStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>(
    initialEmail ? TABS.SIGNUP : TABS.SIGNIN
  );
  const [formData, setFormData] = useState({
    email: initialEmail || "",
    password: "",
    confirm_password: "",
    full_name: "",
    lastname: ""
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await signIn(formData.email, formData.password);
    if (!error) {
      toast({
        title: TITLES.WELCOME_BACK,
        description: MESSAGES.LOGIN_SUCCESS
      });
      const { user } = data;

      if (user?.email_confirmed_at) {
        // Fetch actual role from users table
        const { data: profile } = await supabase
          .from("users")
          .select("role:roles(name)")
          .eq("auth_user_id", user.id)
          .single();
        const profileData = profile as any;
        const roleData = profileData?.role;
        const userRole = Array.isArray(roleData)
          ? roleData[0]?.name
          : roleData?.name ||
            (type === ROLES.COMPANY ? ROLES.COMPANY : ROLES.CANDIDATE);

        const dashboard =
          userRole === ROLES.COMPANY
            ? ROUTES.COMPANY_DASHBOARD
            : ROUTES.CANDIDATE_DASHBOARD;

        window.location.href = dashboard;
      } else {
        // Even if not confirmed, we might want to check if they are manually verified in DB
        const { data: profile } = await supabase
          .from("users")
          .select("verified_at, role:roles(name)")
          .eq("auth_user_id", user.id)
          .single();

        if (profile?.verified_at) {
          const profileData = profile as any;
          const roleData = profileData?.role;
          const userRole = Array.isArray(roleData)
            ? roleData[0]?.name
            : roleData?.name || (type === "company" ? "company" : "candidate");

          const dashboard =
            userRole === ROLES.COMPANY
              ? ROUTES.COMPANY_DASHBOARD
              : ROUTES.CANDIDATE_DASHBOARD;
          window.location.href = dashboard;
        } else {
          onClose();
          toast({
            title: TITLES.VERIFICATION_REQUIRED,
            description: MESSAGES.VERIFY_EMAIL_REQUIRED
          });
        }
      }
    } else {
      toast({
        variant: "destructive",
        title: TITLES.LOGIN_ERROR,
        description: error.message || MESSAGES.INVALID_CREDENTIALS
      });
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (formData.email.toLowerCase() === "root@admin.local") {
      toast({
        variant: "destructive",
        title: TITLES.ACTION_NOT_ALLOWED,
        description: MESSAGES.ADMIN_REGISTER_ERROR
      });
      setLoading(false);
      setActiveTab(TABS.SIGNIN);
      return;
    }

    if (formData.password !== formData.confirm_password) {
      toast({
        variant: "destructive",
        title: TITLES.PASSWORDS_DO_NOT_MATCH,
        description: MESSAGES.PASSWORDS_MISMATCH
      });
      setLoading(false);
      return;
    }

    const metaData = {
      type: type,
      full_name: formData.full_name,
      lastname: formData.lastname
    };

    const options = { data: metaData };

    // @ts-ignore - Supabase options type matching
    const { data: authData, error } = await signUp(
      formData.email,
      formData.password,
      options
    );

    if (!error && authData?.user) {
      const user = authData.user;

      // Wait a moment for trigger to create user record
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Fetch verification token
      const { data: userRecord } = await supabase
        .from("users")
        .select("verification_token")
        .eq("auth_user_id", user.id)
        .single();

      const verificationToken = userRecord?.verification_token;

      // Logic to accept invitation if token is present
      if (token && jobId && type === ROLES.CANDIDATE) {
        try {
          await fetch(API_ROUTES.ACCEPT_INVITE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: formData.email,
              token,
              jobId,
              userId: user.id
            })
          });
        } catch (inviteProcessError) {
          console.error("Error processing invitation:", inviteProcessError);
        }
      }

      // Send verification email
      try {
        const emailResponse = await fetch(API_ROUTES.SEND_EMAIL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "verification",
            to: formData.email,
            payload: {
              link: `${window.location.origin}${ROUTES.VERIFY_EMAIL}?token=${verificationToken || ""}`
            }
          })
        });

        if (!emailResponse.ok) {
          throw new Error("Failed to send verification email");
        }
      } catch (emailErr) {
        console.error("Failed to send verification email", emailErr);
        toast({
          variant: "destructive",
          title: TITLES.ERROR,
          description: MESSAGES.RESEND_ERROR
        });
        setLoading(false);
        return;
      }

      toast({
        title: TITLES.REGISTRATION_SUCCESS,
        description: MESSAGES.REGISTRATION_SUCCESS_MSG
      });

      onClose();

      // Redirect to verify-email page where middleware will catch them
      setTimeout(() => {
        window.location.href = `${ROUTES.VERIFY_EMAIL}?justRegistered=true`;
      }, 1500);
    } else if (error?.message?.includes("User already registered")) {
      toast({
        variant: "destructive",
        title: TITLES.EMAIL_ALREADY_REGISTERED,
        description: MESSAGES.EMAIL_ALREADY_REGISTERED_MSG
      });
      setActiveTab(TABS.SIGNIN);
    } else {
      toast({
        variant: "destructive",
        title: TITLES.REGISTRATION_ERROR,
        description: error.message || MESSAGES.SOMETHING_WENT_WRONG
      });
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-effect border-blue-500/50 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-text">
            {type === ROLES.COMPANY
              ? TITLES.COMPANY_LOGIN
              : TITLES.CANDIDATE_LOGIN}
          </DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-blue-950/30">
            <TabsTrigger value="signin">{BUTTONS.LOGIN}</TabsTrigger>
            <TabsTrigger value="signup">{BUTTONS.REGISTER}</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email-signin" className="text-slate-300">
                  {LABELS.EMAIL}
                </Label>
                <Input
                  id="email-signin"
                  name="email"
                  type="email"
                  placeholder={PLACEHOLDERS.EMAIL_GENERIC}
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-blue-950/20 border-blue-400/20 text-slate-100"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-signin" className="text-slate-300">
                  {LABELS.PASSWORD}
                </Label>
                <div className="relative">
                  <Input
                    id="password-signin"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    className="bg-blue-950/20 border-blue-400/20 text-slate-100 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-slate-400 hover:text-slate-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
              >
                {loading ? BUTTONS.LOGGING_IN : BUTTONS.LOGIN_SUBMIT}
              </Button>
            </form>
            <DialogFooter className="pt-4">
              <Link
                href="/forgot-password"
                onClick={onClose}
                className="text-sm text-cyan-400 hover:underline text-center w-full"
              >
                {LINKS.FORGOT_PASSWORD}
              </Link>
            </DialogFooter>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="full_name-signup" className="text-slate-300">
                  {LABELS.FULL_NAME}
                </Label>
                <Input
                  id="full_name-signup"
                  name="full_name"
                  placeholder={PLACEHOLDERS.FULL_NAME}
                  value={formData.full_name}
                  onChange={handleChange}
                  className="bg-blue-950/20 border-blue-400/20 text-slate-100"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastname-signup" className="text-slate-300">
                  {LABELS.LAST_NAME}
                </Label>
                <Input
                  id="lastname-signup"
                  name="lastname"
                  placeholder={PLACEHOLDERS.LAST_NAME}
                  value={formData.lastname}
                  onChange={handleChange}
                  className="bg-blue-950/20 border-blue-400/20 text-slate-100"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-signup" className="text-slate-300">
                  {LABELS.EMAIL}
                </Label>
                <Input
                  id="email-signup"
                  name="email"
                  type="email"
                  placeholder={PLACEHOLDERS.EMAIL_GENERIC}
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-blue-950/20 border-blue-400/20 text-slate-100"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-signup" className="text-slate-300">
                  {LABELS.PASSWORD}
                </Label>
                <div className="relative">
                  <Input
                    id="password-signup"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    className="bg-blue-950/20 border-blue-400/20 text-slate-100 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-slate-400 hover:text-slate-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="confirm_password-signup"
                  className="text-slate-300"
                >
                  {LABELS.CONFIRM_PASSWORD}
                </Label>
                <div className="relative">
                  <Input
                    id="confirm_password-signup"
                    name="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirm_password}
                    onChange={handleChange}
                    className="bg-blue-950/20 border-blue-400/20 text-slate-100 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-slate-400 hover:text-slate-200"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
              >
                {loading ? BUTTONS.CREATING_ACCOUNT : BUTTONS.CREATE_ACCOUNT}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
