"use client";

import { useEffect } from "react";
import { captureUTMParams } from "@/lib/attribution";

export function UTMCapture() {
  useEffect(() => {
    captureUTMParams();
  }, []);

  return null;
}
