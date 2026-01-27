'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid work email address" }),
});

type FormData = z.infer<typeof formSchema>;

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setIsSuccess(true);
      } else {
        console.error("Submission failed");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col sm:flex-row gap-0 border border-slate-800"
          >
            <div className="flex-1 flex flex-col">
              <input
                {...register("email")}
                type="email"
                placeholder="WORK EMAIL"
                aria-label="Work Email"
                aria-invalid={!!errors.email}
                className="w-full h-14 px-6 bg-[#020617] text-white placeholder:text-slate-600 focus:outline-none font-bold text-xs tracking-widest"
                required
              />
              {errors.email && (
                <span className="text-red-500 text-[10px] font-bold uppercase tracking-widest px-6 pb-2 bg-[#020617]">
                  {errors.email.message}
                </span>
              )}
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-14 text-xs font-black uppercase tracking-[0.2em] rounded-none disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Request Audit"
              )}
            </Button>
          </motion.form>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-12 text-center"
          >
            <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-8" />
            <h2 className="text-3xl md:text-5xl font-black mb-4 text-white tracking-tighter uppercase">
              Request Received.
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto font-medium">
              Our Enterprise Team has been notified. You will receive a secure communication link within 24 hours to begin your spend recovery audit.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

