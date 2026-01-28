import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#020617]">
      <SignIn 
        appearance={{
          elements: {
            formButtonPrimary: 
              "bg-gold hover:bg-gold-light text-[#020617] font-black uppercase tracking-widest rounded-none",
            card: "bg-slate-950 border border-slate-800 rounded-none shadow-2xl",
            headerTitle: "text-white font-black uppercase tracking-tighter text-2xl",
            headerSubtitle: "text-slate-400 font-bold uppercase tracking-widest text-[10px]",
            socialButtonsBlockButton: "rounded-none border-slate-800 bg-slate-900 text-white hover:bg-slate-800",
            socialButtonsBlockButtonText: "font-bold uppercase tracking-widest text-[10px]",
            formFieldLabel: "text-slate-400 font-bold uppercase tracking-widest text-[10px]",
            formFieldInput: "bg-slate-900 border-slate-800 text-white rounded-none focus:ring-gold focus:border-gold",
            footerActionText: "text-slate-500 font-bold uppercase tracking-widest text-[10px]",
            footerActionLink: "text-gold hover:text-gold-light font-black uppercase tracking-widest text-[10px]",
          }
        }}
      />
    </div>
  );
}

