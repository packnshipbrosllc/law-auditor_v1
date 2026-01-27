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
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    setStatus('submitting');
    setErrorMessage("");
    
    try {
      console.log('[ContactForm] Submitting lead:', data.email);
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        console.log('[ContactForm] Submission successful');
        setStatus('success');
        reset();
      } else {
        console.error('[ContactForm] Submission failed:', result.error);
        setErrorMessage(result.error || "Submission failed. Please try again.");
        setStatus('error');
      }
    } catch (error) {
      console.error('[ContactForm] Unexpected error:', error);
      setErrorMessage("A network error occurred. Please check your connection.");
      setStatus('error');
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <AnimatePresence mode="wait">
        {status !== 'success' ? (
          <motion.div key="form-container">
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit(onSubmit)}
              className={`flex flex-col sm:flex-row gap-0 border ${status === 'error' ? 'border-red-500/50' : 'border-slate-800'}`}
            >
              <div className="flex-1 flex flex-col">
                <input
                  {...register("email")}
                  type="email"
                  placeholder="WORK EMAIL"
                  aria-label="Work Email"
                  aria-invalid={!!errors.email}
                  disabled={status === 'submitting'}
                  className="w-full h-14 px-6 bg-[#020617] text-white placeholder:text-slate-600 focus:outline-none font-bold text-xs tracking-widest disabled:opacity-50"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={status === 'submitting'}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-14 text-xs font-black uppercase tracking-[0.2em] rounded-none disabled:opacity-50"
              >
                {status === 'submitting' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Request Analysis"
                )}
              </Button>
            </motion.form>
            
            {(errors.email || status === 'error') && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-4 text-left px-2"
              >
                {errors.email?.message || errorMessage}
              </motion.div>
            )}
          </motion.div>
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
                  Our Enterprise Team has been notified. You will receive a secure communication link within 24 hours to begin your spend recovery analysis.
                </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

