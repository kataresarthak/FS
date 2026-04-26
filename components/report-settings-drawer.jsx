"use client";

import { useEffect, useState, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-toastify";
import { getReportSettings, updateReportSettings } from "@/actions/report";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";

export default function ReportSettingsDrawer({ children }) {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [email, setEmail] = useState("");
  const [repeatOn, setRepeatOn] = useState("MONTHLY");
  const [saveLoading, setSaveLoading] = useState(false);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await getReportSettings();
        if (response?.success) {
          setEnabled(response.data?.enabled ?? true);
          setEmail(response.data?.email ?? "");
          setRepeatOn(response.data?.frequency ?? "MONTHLY");
        }
      } catch (error) {
        toast.error("Failed to load report settings");
      }
    }

    loadSettings();
  }, []);

  async function save() {
    try {
      setSaveLoading(true);

      const response = await updateReportSettings({
        enabled,
        email,
        frequency: repeatOn,
      });

      if (!response?.success) {
        toast.error(response?.error?.message || "Failed to save settings");
        return;
      }

      toast.success("Report settings saved");
      setOpen(false);
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaveLoading(false);
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      <DrawerTrigger asChild>{children}</DrawerTrigger>

      <DrawerContent
        onOpenAutoFocus={() => {
          closeButtonRef.current?.focus();
        }}
        className="fixed inset-auto right-2 top-2 bottom-2 z-50 w-full max-w-[420px] flex flex-col bg-white border shadow-2xl overflow-y-auto px-6 pt-4 pb-6 rounded-[32px] outline-none scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        <div className="relative mb-4 mt-2 px-1">
          <div className="pr-8">
            <DrawerTitle asChild>
              <h2
                className="text-xl font-bold text-[#1E293B]"
              >
                Report Settings
              </h2>
            </DrawerTitle>
            <DrawerDescription asChild>
              <p className="text-sm text-slate-500">
                Enable or disable monthly financial report emails
              </p>
            </DrawerDescription>
          </div>
          <DrawerClose asChild>
            <Button
              ref={closeButtonRef}
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-8 w-8 rounded-full hover:bg-black/5"
            >
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </div>

        <div className="space-y-4">
          <div
            className="rounded-lg border p-4"
            style={{ borderColor: "#E6EEF0" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Monthly Reports</p>
                <p className="text-sm text-slate-500">Reports activated</p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Recieving Email</label>
            <Input
              value={email}
              readOnly
              placeholder="you@example.com"
              className="mt-2 bg-slate-50 cursor-not-allowed text-slate-500"
            />
            <p className="text-[10px] text-slate-400 mt-1 italic">
              Reports are sent to your verified primary email address.
            </p>
          </div>

          <div>
            <label htmlFor="repeat-on-select" className="text-sm font-medium">Repeat On</label>
            <Select
              value={repeatOn}
              onValueChange={setRepeatOn}
              onOpenChange={(open) => {
                if (!open) {
                  if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                  }
                }
              }}
              className="mt-2"
            >
              <SelectTrigger id="repeat-on-select" aria-label="Repeat frequency" className="h-9 border-[#DDE4E5] bg-white text-sm focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent usePortal={false}>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md bg-[#F8F9FB] p-4">
            <p className="font-medium">Schedule Summary</p>
            <p className="text-sm text-slate-500 mt-2">
              Report will be sent once a month on the 1st day of the next
              month
            </p>
          </div>

          <div>
            <Button
              className="w-full text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover-gradient-button"
              style={{
                background:
                  "linear-gradient(to right, #32484F, #233A41, #CAA166)",
              }}
              onClick={() => save()}
              disabled={saveLoading}
            >
              {saveLoading ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
