"use client";

import { useState } from "react";

import AppSidebar from "@/app/components/organisms/AppSidebar";
import MobileSidebarDialog from "@/app/components/organisms/MobileSidebarDialog";

export default function MobileSidebarShell() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <MobileSidebarDialog title="Menu" open={open} onOpenChange={setOpen}>
      <AppSidebar onNavigate={close} />
    </MobileSidebarDialog>
  );
}
