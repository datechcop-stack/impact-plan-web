"use client";

import { useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "impact-plan-guide-collapsed";

type ImpactPlanGuideProps = {
  className?: string;
};

export function ImpactPlanGuide({ className }: ImpactPlanGuideProps) {
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(STORAGE_KEY) !== "1";
  });

  function toggle() {
    setOpen((current) => {
      const next = !current;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, next ? "0" : "1");
      }
      return next;
    });
  }

  return (
    <Card className={cn("border-accent/30 bg-accent-soft/40", className)}>
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 text-left"
        onClick={toggle}
        aria-expanded={open}
      >
        <div>
          <CardTitle>How to use the Impact Plan</CardTitle>
          <p className="mt-1 text-sm text-muted">
            A quick guide to setting goals, year-end review, and who does what.
          </p>
        </div>
        <span className="mt-1 text-sm font-semibold text-accent">{open ? "Hide" : "Show"}</span>
      </button>
      {open ? (
        <div className="mt-4 space-y-4 text-sm text-navy">
          <section>
            <h3 className="font-bold">1. Build your plan</h3>
            <p className="mt-1 text-muted">
              Add entries under each enabled section (Projects, Business Development, Personal
              Development, CoP). Each entry needs a title, objectives with success criteria, a
              tagged project manager, and a due date. Lock the plan when goals are ready so managers
              can review them.
            </p>
          </section>
          <section>
            <h3 className="font-bold">2. Year-end self-assessment</h3>
            <p className="mt-1 text-muted">
              When admin opens the year-end window, update entries if needed, then complete a
              self-assessment for every entry (result, narrative, optional evidence). Submit the
              whole plan once all entries are done — tagged project managers can score only after
              that submission.
            </p>
          </section>
          <section>
            <h3 className="font-bold">3. Project manager scoring</h3>
            <p className="mt-1 text-muted">
              Managers you tagged score each entry (0–100%) and leave a comment. You can track
              progress on My Plan while scoring is underway.
            </p>
          </section>
          <section>
            <h3 className="font-bold">4. Line manager final review</h3>
            <p className="mt-1 text-muted">
              After every entry is PM scored, your line manager adds an overall comment and
              finalizes the plan. You will then add employee feedback to conclude the year.
            </p>
          </section>
          <section>
            <h3 className="font-bold">Tips</h3>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-muted">
              <li>Use one entry per major project or focus area so goals stay easy to review.</li>
              <li>Collapse completed entries while adding new ones to keep the page manageable.</li>
              <li>
                If the plan is locked and you need changes, use Request edit access from My Plan.
              </li>
              <li>
                If you also manage projects or people, use Projects You Manage and People You Manage
                in the sidebar.
              </li>
            </ul>
          </section>
        </div>
      ) : null}
    </Card>
  );
}
