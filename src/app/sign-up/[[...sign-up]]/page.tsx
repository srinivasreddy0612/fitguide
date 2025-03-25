import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center opacity-5"></div>
      <div className="z-10 w-full max-w-md">
        <SignUp appearance={{
          variables: {
            colorPrimary: "#4f46e5",
            colorText: "white",
            colorTextSecondary: "#94a3b8",
            colorBackground: "#000000",
            colorInputBackground: "#111111",
            colorInputText: "white"
          },
          elements: {
            formButtonPrimary: {
              backgroundColor: "#4f46e5",
              color: "white",
              "&:hover": {
                backgroundColor: "#4338ca"
              }
            },
            card: {
              backdropFilter: "blur(16px)",
              backgroundColor: "rgba(0,0,0,0.7)",
              borderColor: "#1f2937",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            },
            headerTitle: {
              color: "white",
              fontSize: "1.5rem",
              fontWeight: "bold"
            },
            headerSubtitle: {
              color: "#94a3b8"
            },
            formFieldLabel: {
              color: "#d1d5db"
            },
            formFieldInput: {
              backgroundColor: "rgba(0,0,0,0.7)",
              borderColor: "#374151",
              color: "white",
              "&:focus": {
                borderColor: "#4f46e5"
              }
            },
            footerActionLink: {
              color: "#818cf8",
              "&:hover": {
                color: "#a5b4fc"
              }
            },
            identityPreviewText: {
              color: "#d1d5db"
            },
            formFieldAction: {
              color: "#818cf8",
              "&:hover": {
                color: "#a5b4fc"
              }
            },
            dividerLine: {
              backgroundColor: "#374151"
            },
            dividerText: {
              color: "#94a3b8",
              backgroundColor: "black"
            },
            socialButtonsIconButton: {
              border: "1px solid #374151",
              backgroundColor: "rgba(0,0,0,0.7)",
              color: "white",
              "&:hover": {
                backgroundColor: "black"
              }
            },
            socialButtonsBlockButton: {
              border: "1px solid #374151",
              backgroundColor: "black",
              color: "white",
              "&:hover": {
                backgroundColor: "#111827"
              }
            },
            otpCodeFieldInput: {
              backgroundColor: "rgba(0,0,0,0.5)",
              borderColor: "#374151",
              color: "white"
            },
            formFieldSuccessText: {
              color: "#10b981"
            },
            formFieldErrorText: {
              color: "#ef4444"
            },
            footer: {
              backgroundColor: "rgba(0,0,0,0.7)",
              borderTopColor: "#1f2937", 
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
            },
            switchField: {
              color: "#94a3b8"
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