"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const TAB_SESSION_KEY = "council_tab_session_v1";

/**
 * One Supabase auth session per browser tab: when the tab is new (no key in
 * sessionStorage), clear any persisted auth cookies so the user starts at
 * login. sessionStorage is cleared when the tab closes, so revisiting the site
 * in a new tab always signs out first. In-tab navigation and refresh keep the
 * key and stay signed in.
 */
export function AuthBootstrap() {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) {
      return;
    }
    ran.current = true;

    if (typeof sessionStorage === "undefined") {
      return;
    }

    if (sessionStorage.getItem(TAB_SESSION_KEY)) {
      return;
    }

    sessionStorage.setItem(TAB_SESSION_KEY, "1");

    const supabase = createClient();
    void (async () => {
      await supabase.auth.signOut();
      router.refresh();
    })();
  }, [router]);

  return null;
}
