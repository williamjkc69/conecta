"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import {
  BUTTONS,
  TITLES,
  MESSAGES,
  LABELS,
  PLACEHOLDERS
} from "@/constants/text";

interface CompanyOnboardingModalProps {
  userId: number; // The public.users id (integer)
  onSuccess: () => void;
}

const CompanyOnboardingModal: React.FC<CompanyOnboardingModalProps> = ({
  userId,
  onSuccess
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    phone: "",
    email: ""
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let logoUrl = null;

      // 2. Create Company Record
      const { data: companyData, error: insertError } = await supabase
        .from("companies")
        .insert({
          name: formData.name,
          description: formData.description,
          phone: formData.phone,
          email: formData.email, // Contact email for the company listing
          logo: logoUrl
        })
        .select()
        .single();

      if (insertError) throw insertError;

      console.log("Company created successfully:", companyData);
      console.log("Updating user", userId, "with company_id:", companyData.id);

      // 3. Link Company to User
      const { error: linkError } = await supabase
        .from("users")
        .update({ company_id: companyData.id })
        .eq("id", userId);

      if (linkError) {
        console.error("Error linking company to user:", linkError);
        throw linkError;
      }

      console.log("User successfully linked to company");

      toast({
        title: TITLES.COMPANY_CREATED_SUCCESS,
        description: MESSAGES.COMPANY_CREATED_DESC
      });

      // Wait a moment for the database to update, then trigger refetch
      setTimeout(() => {
        onSuccess(); // Triggers refetch in parent
        // Reload page to ensure fresh data
        window.location.reload();
      }, 500);
    } catch (error: any) {
      console.error("Error onboarding company:", error);
      toast({
        title: TITLES.ERROR,
        description: error.message || MESSAGES.COMPANY_SAVE_ERROR,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent
        className="glass-effect border-blue-500/50 text-slate-100 sm:max-w-[500px]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-text text-center">
            {TITLES.COMPANY_SETUP}
          </DialogTitle>
          <p className="text-slate-400 text-center text-sm">
            {MESSAGES.COMPANY_SETUP_DESC}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-300">
              {LABELS.COMPANY_NAME} *
            </Label>
            <Input
              id="name"
              name="name"
              placeholder={PLACEHOLDERS.COMPANY_NAME_PH}
              value={formData.name}
              onChange={handleChange}
              className="bg-blue-950/20 border-blue-400/20 text-slate-100"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-300">
              {LABELS.DESCRIPTION}
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder={PLACEHOLDERS.COMPANY_DESC_PH}
              value={formData.description}
              onChange={handleChange}
              className="bg-blue-950/20 border-blue-400/20 text-slate-100 min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-300">
                {LABELS.PHONE}
              </Label>
              <Input
                id="phone"
                name="phone"
                placeholder={PLACEHOLDERS.PHONE_PH}
                value={formData.phone}
                onChange={handleChange}
                className="bg-blue-950/20 border-blue-400/20 text-slate-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">
                {LABELS.CONTACT_EMAIL}
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={PLACEHOLDERS.EMAIL_GENERIC}
                value={formData.email}
                onChange={handleChange}
                className="bg-blue-950/20 border-blue-400/20 text-slate-100"
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  {BUTTONS.SAVING}
                </>
              ) : (
                BUTTONS.SAVE_CONTINUE
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyOnboardingModal;
