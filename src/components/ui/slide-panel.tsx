import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

const SlidePanel = DialogPrimitive.Root;

const SlidePanelTrigger = DialogPrimitive.Trigger;

const SlidePanelClose = DialogPrimitive.Close;

const SlidePanelPortal = DialogPrimitive.Portal;

const SlidePanelOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
SlidePanelOverlay.displayName = DialogPrimitive.Overlay.displayName;

const SlidePanelContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    title?: string;
  }
>(({ className, children, title = "Settings", ...props }, ref) => (
  <SlidePanelPortal>
    <SlidePanelOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-y-0 right-0 z-50 h-full w-[25rem] overflow-y-auto border-l border-white/10 bg-black/40 backdrop-blur-xl shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right-full duration-300",
        className
      )}
      {...props}
    >
      {!title ? (
        <DialogPrimitive.Title className="sr-only">Settings Panel</DialogPrimitive.Title>
      ) : null}
      {children}
    </DialogPrimitive.Content>
  </SlidePanelPortal>
));
SlidePanelContent.displayName = DialogPrimitive.Content.displayName;

const SlidePanelHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex justify-between items-center p-6 border-b border-white/10",
      className
    )}
    {...props}
  />
);
SlidePanelHeader.displayName = "SlidePanelHeader";

const SlidePanelTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-2xl font-light tracking-wide text-white/90",
      className
    )}
    {...props}
  />
));
SlidePanelTitle.displayName = DialogPrimitive.Title.displayName;

const SlidePanelBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex-grow overflow-y-auto p-6 custom-scrollbar",
      className
    )}
    {...props}
  />
);
SlidePanelBody.displayName = "SlidePanelBody";

const SlidePanelFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "p-6 border-t border-white/10 mt-auto",
      className
    )}
    {...props}
  />
);
SlidePanelFooter.displayName = "SlidePanelFooter";

export {
  SlidePanel,
  SlidePanelTrigger,
  SlidePanelClose,
  SlidePanelContent,
  SlidePanelHeader,
  SlidePanelTitle,
  SlidePanelBody,
  SlidePanelFooter,
}; 