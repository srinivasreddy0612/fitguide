// app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center opacity-3"></div>
      <div className="z-10 w-full max-w-md">
        <SignIn appearance={{
          variables: {
            colorPrimary: "#4f46e5",
            colorText: "white",
            colorTextSecondary: "rgba(255, 255, 255, 0.6)",
            colorBackground: "rgba(0, 0, 0, 0)",
            colorInputBackground: "rgba(255, 255, 255, 0.05)",
            colorInputText: "white"
          },
          elements: {
            formButtonPrimary: 
              'bg-white/10 backdrop-blur-sm border border-white/10 text-white hover:bg-white/15 transition-colors',
            card: 'backdrop-blur-lg bg-white/5 border border-white/10',
            headerTitle: 'text-white/90',
            headerSubtitle: 'text-white/60',
            formFieldLabel: 'text-white/80',
            formFieldInput: 'bg-white/5 border-white/10 text-white',
            footerActionLink: 'text-white/60 hover:text-white',
            identityPreviewText: 'text-white/80',
            formFieldAction: 'text-white/60 hover:text-white',
            dividerLine: {
              backgroundColor: "rgba(255, 255, 255, 0.1)"
            },
            dividerText: {
              color: "rgba(255, 255, 255, 0.6)",
              backgroundColor: "transparent"
            },
            socialButtonsIconButton: {
              border: "1px solid rgba(255, 255, 255, 0.1)",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              color: "white",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)"
              }
            },
            socialButtonsBlockButton: {
              border: "1px solid rgba(255, 255, 255, 0.1)",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              color: "white",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)"
              }
            },
            otpCodeFieldInput: {
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderColor: "rgba(255, 255, 255, 0.1)",
              color: "white"
            },
            formFieldSuccessText: {
              color: "#10b981"
            },
            formFieldErrorText: {
              color: "#ef4444"
            },
            footer: {
              backgroundColor: "rgba(0, 0, 0, 0)",
              borderTopColor: "rgba(255, 255, 255, 0.1)", 
              borderTopWidth: "1px"
            },
            main: {
              padding: "1.5rem"
            },
            logoBox: {
              display: "none"
            },
            navbar: {
              display: "none"
            }
          },
          layout: {
            socialButtonsVariant: "blockButton",
            socialButtonsPlacement: "top"
          }
        }} />
      </div>
    </div>
  );
}