import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "paper group-[.toaster]:bg-surface group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lift group-[.toaster]:rounded-2xl",
          description: "group-[.toast]:text-muted",
          actionButton: "group-[.toast]:bg-moss group-[.toast]:text-cream",
          cancelButton: "group-[.toast]:bg-border group-[.toast]:text-foreground",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
