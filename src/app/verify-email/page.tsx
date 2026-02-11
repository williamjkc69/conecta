"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, CheckCircle, XCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { BUTTONS, TITLES, MESSAGES } from "@/constants/text";
import { ROUTES } from "@/constants/routes";
import { sendEmailAction } from "@/lib/api/sendEmail";
import { ROLES } from "@/constants/roles";

function VerifyEmailContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const email = searchParams.get("email"); // kept for fallback or specific error messages, but verification relies on token

  const [status, setStatus] = useState<
    "verifying" | "success" | "error" | "unverified"
  >(token ? "verifying" : "verifying");

  const [message, setMessage] = useState<string>(MESSAGES.VERIFYING_EMAIL_MSG);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null); // Store email for resend

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const justRegistered = searchParams.get("justRegistered");
  const [redirectUrl, setRedirectUrl] = useState<string>(ROUTES.HOME);

  useEffect(() => {
    // Only start cooldown if user just registered
    if (justRegistered === "true" && status === "unverified") {
      setCooldown(60);
    }
  }, [justRegistered, status]);

  // ... (timer useEffect remains the same)

  useEffect(() => {
    const verify = async () => {
      // If token is present, try to verify with token
      if (token) {
        try {
          const { data, error } = await supabase.rpc("verify_user", { token });

          if (error) {
            throw error;
          }

          if (data === true) {
            setStatus("success");
            setMessage(MESSAGES.EMAIL_VERIFIED);

            // Determine redirect URL
            const {
              data: { session }
            } = await supabase.auth.getSession();

            if (session) {
              await supabase.auth.updateUser({
                data: { verified: true }
              });

              const { data: profileData } = await supabase
                .from("users")
                .select("role:roles(name)")
                .eq("auth_user_id", session.user.id)
                .single();

              const roleName = (profileData as any)?.role?.name;
              const dashboard =
                roleName === ROLES.COMPANY
                  ? ROUTES.COMPANY_DASHBOARD
                  : ROUTES.CANDIDATE_DASHBOARD;
              setRedirectUrl(dashboard);
            } else {
              setRedirectUrl(ROUTES.LOGIN);
            }
          } else {
            setStatus("error");
            setMessage(MESSAGES.EMAIL_INVALID_LINK);
          }
        } catch (err: any) {
          console.error("Verification error:", err);
          setStatus("error");
          setMessage(MESSAGES.GENERIC_ERROR);
        }
        return;
      }

      // If no token, check session status
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (session) {
        // Check if user is already verified in DB
        const { data: userRecord } = await supabase
          .from("users")
          .select("verified_at, email")
          .eq("auth_user_id", session.user.id)
          .single();

        // Store email for resend functionality
        if (userRecord?.email) {
          setUserEmail(userRecord.email);
        }

        if (userRecord?.verified_at) {
          // User IS verified - redirect to dashboard
          setStatus("success");
          setMessage(MESSAGES.ALREADY_VERIFIED_MSG);

          const { data: profileData } = await supabase
            .from("users")
            .select("role:roles(name)")
            .eq("auth_user_id", session.user.id)
            .single();

          const roleName = (profileData as any)?.role?.name;
          const dashboard =
            roleName === ROLES.COMPANY
              ? ROUTES.COMPANY_DASHBOARD
              : ROUTES.CANDIDATE_DASHBOARD;

          setRedirectUrl(dashboard);

          // Redirect to appropriate dashboard after a short delay
          setTimeout(() => {
            router.push(dashboard);
          }, 2000);
        } else {
          // User is NOT verified - show unverified state
          setStatus("unverified");
          setMessage(MESSAGES.VERIFICATION_PENDING_MSG);
        }
      } else {
        // Not logged in and no token - redirect to home
        setStatus("error");
        setMessage(MESSAGES.LOGIN_TO_VERIFY);
        setTimeout(() => router.push(ROUTES.LOGIN), 2000);
      }
    };

    verify();
  }, [token, email, router]);

  const handleResendEmail = async () => {
    setResending(true);
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      let emailToUse = userEmail || email;
      let tokenToSend = null;

      if (session?.user?.id) {
        // User is logged in - fetch from their auth_user_id
        const { data: userRecord, error: fetchError } = await supabase
          .from("users")
          .select("verification_token, email")
          .eq("auth_user_id", session.user.id)
          .single();

        if (fetchError) {
          console.error("Error fetching user record:", fetchError);
          throw new Error(MESSAGES.USER_INFO_ERROR);
        }

        if (!userRecord?.verification_token) {
          console.error("No verification token found for user");
          throw new Error(MESSAGES.NO_TOKEN_ERROR);
        }

        emailToUse = userRecord.email;
        tokenToSend = userRecord.verification_token;
      } else if (emailToUse) {
        // User is NOT logged in but we have their email - fetch by email
        const { data: userRecord, error: fetchError } = await supabase
          .from("users")
          .select("verification_token")
          .eq("email", emailToUse)
          .single();

        if (fetchError) {
          console.error("Error fetching user by email:", fetchError);
          throw new Error(MESSAGES.USER_INFO_ERROR);
        }

        if (!userRecord?.verification_token) {
          console.error("No verification token found for email");
          throw new Error(MESSAGES.NO_TOKEN_ERROR);
        }

        tokenToSend = userRecord.verification_token;
      } else {
        throw new Error(MESSAGES.NO_EMAIL_ERROR);
      }

      console.log(
        "Resending verification email to:",
        emailToUse,
        "with token:",
        tokenToSend
      );

      const link = `${window.location.origin}${ROUTES.VERIFY_EMAIL}?token=${tokenToSend}`;

      const emailResponse = await sendEmailAction({
        type: "verification",
        to: emailToUse as string,
        payload: { link }
      });

      if (!emailResponse.success) {
        throw new Error(MESSAGES.RESEND_ERROR);
      }

      toast({
        title: MESSAGES.EMAIL_SENT,
        description: MESSAGES.RESEND_SUCCESS
      });

      const isProduction = process.env.NODE_ENV === "production";
      setCooldown(isProduction ? 60 : 10);
    } catch (error: any) {
      console.error("Resend email error:", error);
      toast({
        variant: "destructive",
        title: TITLES.ERROR,
        description: error.message || MESSAGES.RESEND_ERROR
      });
    } finally {
      setResending(false);
    }
  };

  const handleAction = () => {
    if (status === "success" && redirectUrl) {
      router.push(redirectUrl);
    } else {
      router.push(ROUTES.HOME);
    }
  };

  return (
    <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 max-w-md w-full text-center space-y-6">
      {status === "verifying" && (
        <>
          <Loader2 className="w-16 h-16 text-cyan-400 animate-spin mx-auto" />
          <h1 className="text-2xl font-bold">{BUTTONS.VERIFYING}</h1>
          <p className="text-slate-400">{message}</p>
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold text-green-400">
            {TITLES.VERIFIED}
          </h1>
          <p className="text-slate-300">{message}</p>
          <Button
            onClick={handleAction}
            className="w-full bg-cyan-600 hover:bg-cyan-500"
          >
            {BUTTONS.GO_TO_DASHBOARD}
          </Button>
        </>
      )}

      {status === "error" && (
        <>
          <XCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold text-red-400">{TITLES.ERROR}</h1>
          <p className="text-slate-300 mb-4">{message}</p>
          <Button
            onClick={() => router.push(ROUTES.HOME)}
            variant="outline"
            className="w-full border-slate-600 hover:bg-slate-700"
          >
            {BUTTONS.BACK_HOME}
          </Button>
        </>
      )}

      {status === "unverified" && (
        <>
          <Mail className="w-16 h-16 text-yellow-500 mx-auto animate-pulse" />
          <h1 className="text-2xl font-bold text-yellow-400">
            {TITLES.VERIFY_EMAIL}
          </h1>
          <p className="text-slate-300">{message}</p>
          <div className="space-y-3 pt-4">
            <Button
              onClick={handleResendEmail}
              disabled={resending || cooldown > 0}
              className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-400"
            >
              {resending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {BUTTONS.SENDING}
                </>
              ) : cooldown > 0 ? (
                `${MESSAGES.RESEND_IN} ${cooldown}s`
              ) : (
                BUTTONS.RESEND_EMAIL
              )}
            </Button>
            <Button
              onClick={() => router.push(ROUTES.HOME)}
              variant="ghost"
              className="w-full text-slate-400 hover:text-white"
            >
              {BUTTONS.BACK_HOME}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
      <Suspense
        fallback={<Loader2 className="w-16 h-16 text-cyan-400 animate-spin" />}
      >
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
