import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { differenceInSeconds } from "date-fns";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const PREP_LEVELS = ["Not Started", "Barely Started", "Partially Done", "Almost Ready"] as const;

const formSchema = z.object({
  examDateTime: z.string().min(1, "Exam date and time is required"),
  subjectName: z.string().min(1, "Subject name is required"),
  chaptersRemaining: z.coerce.number().min(1, "Must have at least 1 chapter remaining"),
  prepLevel: z.enum(PREP_LEVELS, {
    required_error: "Please select a preparation level",
  }),
});

type FormValues = z.infer<typeof formSchema>;

type PanicStatus = "Safe" | "Risky" | "Critical";

const STATUS_CONFIG: Record<PanicStatus, {
  label: string;
  subLabel: string;
  textColor: string;
  borderColor: string;
  bgColor: string;
  barColor: string;
}> = {
  Safe: {
    label: "SAFE",
    subLabel: "You have got this",
    textColor: "text-green-400",
    borderColor: "border-green-500",
    bgColor: "bg-green-500/10",
    barColor: "bg-green-500",
  },
  Risky: {
    label: "RISKY",
    subLabel: "Focus now",
    textColor: "text-orange-400",
    borderColor: "border-orange-400",
    bgColor: "bg-orange-400/10",
    barColor: "bg-orange-400",
  },
  Critical: {
    label: "CRITICAL",
    subLabel: "Emergency mode",
    textColor: "text-red-500",
    borderColor: "border-red-500",
    bgColor: "bg-red-500/10",
    barColor: "bg-red-500",
  },
};

export default function Home() {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [status, setStatus] = useState<PanicStatus | null>(null);
  const [noTimeError, setNoTimeError] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      examDateTime: localStorage.getItem("examDateTime") || "",
      subjectName: localStorage.getItem("subjectName") || "",
      chaptersRemaining: localStorage.getItem("chaptersRemaining") ? Number(localStorage.getItem("chaptersRemaining")) : 1,
      prepLevel: (localStorage.getItem("prepLevel") as FormValues["prepLevel"]) || undefined,
    },
  });

  const { watch } = form;
  const examDateTimeValue = watch("examDateTime");

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.examDateTime) localStorage.setItem("examDateTime", value.examDateTime);
      if (value.subjectName) localStorage.setItem("subjectName", value.subjectName);
      if (value.chaptersRemaining) localStorage.setItem("chaptersRemaining", String(value.chaptersRemaining));
      if (value.prepLevel) localStorage.setItem("prepLevel", value.prepLevel);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    if (!examDateTimeValue) {
      setTimeLeft(null);
      return;
    }

    const tick = () => {
      const now = new Date();
      const target = new Date(examDateTimeValue);
      const diffSeconds = differenceInSeconds(target, now);

      if (diffSeconds <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diffSeconds / (3600 * 24));
      const hours = Math.floor((diffSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((diffSeconds % 3600) / 60);
      const seconds = diffSeconds % 60;
      setTimeLeft({ days, hours, minutes, seconds });
    };

    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [examDateTimeValue]);

  function calculateStatus(data: FormValues) {
    if (!timeLeft) {
      setNoTimeError(true);
      return;
    }
    setNoTimeError(false);

    const totalHours = timeLeft.days * 24 + timeLeft.hours + timeLeft.minutes / 60;
    const chapters = data.chaptersRemaining;
    const prep = data.prepLevel;

    if (totalHours > 48 && chapters <= 3 && (prep === "Partially Done" || prep === "Almost Ready")) {
      setStatus("Safe");
    } else if (totalHours < 12 || chapters > 7 || (prep === "Not Started" && totalHours < 24)) {
      setStatus("Critical");
    } else {
      setStatus("Risky");
    }
  }

  const suggestions: Record<PanicStatus, string[]> = {
    Safe: [
      "Review your notes chapter by chapter",
      "Do practice questions for each chapter",
      "Get 8 hours of sleep tonight",
      "Make a brief summary sheet",
    ],
    Risky: [
      "Skip detailed reading — focus on key concepts only",
      "Prioritize the most important chapters first",
      "Use the 20/80 rule: 20% of content = 80% of exam",
      "Take 10-min breaks every hour",
    ],
    Critical: [
      "Drop everything — open your notes NOW",
      "Focus only on chapter summaries and headings",
      "Write down formulas and key definitions only",
      "Attempt past exam papers immediately",
      "Skip sleep only as last resort — 4 hours minimum",
    ],
  };

  const padZero = (num: number) => String(num).padStart(2, "0");

  return (
    <div className="min-h-screen bg-background font-sans">
      <div className="max-w-[680px] mx-auto px-4 py-8 sm:px-6 sm:py-10 flex flex-col gap-5">

        {/* Page header */}
        <div className="mb-1">
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
            Panic<span className="text-primary">Mode</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Last-minute exam survival tool</p>
        </div>

        {/* Section 1: Exam Countdown Timer */}
        <Card className="border-border bg-card border">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
              Exam Countdown
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {timeLeft ? (
              <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
                {[
                  { value: timeLeft.days, label: "Days" },
                  { value: timeLeft.hours, label: "Hours" },
                  { value: timeLeft.minutes, label: "Mins" },
                  { value: timeLeft.seconds, label: "Secs" },
                ].map(({ value, label }) => (
                  <div key={label} className="flex flex-col border border-border bg-background py-3 px-1 sm:py-4">
                    <span
                      data-testid={`countdown-${label.toLowerCase()}`}
                      className="text-3xl sm:text-5xl font-black font-mono text-primary leading-none tabular-nums"
                    >
                      {padZero(value)}
                    </span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground mt-2 uppercase tracking-widest">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-border py-8 text-center text-muted-foreground text-sm">
                Set exam date &amp; time below to start the timer
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 2: Study Planner Form */}
        <Card className="border-border bg-card border">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
              Study Details
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(calculateStatus)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="examDateTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-xs tracking-wider text-muted-foreground font-medium">
                          Exam Date &amp; Time
                        </FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-examDateTime"
                            type="datetime-local"
                            className="border-input focus-visible:ring-primary bg-background font-mono text-sm h-10"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subjectName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-xs tracking-wider text-muted-foreground font-medium">
                          Subject
                        </FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-subjectName"
                            placeholder="e.g. Thermodynamics"
                            className="border-input focus-visible:ring-primary bg-background text-sm h-10"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="chaptersRemaining"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-xs tracking-wider text-muted-foreground font-medium">
                          Chapters Left
                        </FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-chaptersRemaining"
                            type="number"
                            min={1}
                            className="border-input focus-visible:ring-primary bg-background font-mono text-sm h-10"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="prepLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-xs tracking-wider text-muted-foreground font-medium">
                          Prep Level
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger
                              data-testid="select-prepLevel"
                              className="border-input focus:ring-primary bg-background text-sm h-10"
                            >
                              <SelectValue placeholder="Select level..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="border-border">
                            {PREP_LEVELS.map((level) => (
                              <SelectItem key={level} value={level} className="text-sm">
                                {level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                {noTimeError && (
                  <p className="text-destructive text-sm font-medium" data-testid="error-noTime">
                    Set your exam date and time first to assess your situation.
                  </p>
                )}

                <Button
                  data-testid="button-assess"
                  type="submit"
                  className="w-full font-bold uppercase tracking-widest text-sm h-12 bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
                >
                  Assess Situation
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {status && (() => {
          const cfg = STATUS_CONFIG[status];
          return (
            <>
              {/* Section 3: Panic Status */}
              <Card
                data-testid="card-status"
                className={`border ${cfg.borderColor} ${cfg.bgColor}`}
              >
                <CardContent className="px-5 py-6">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                    Current Status
                  </p>
                  <div className="flex items-center gap-4">
                    <div className={`w-1 self-stretch rounded-full ${cfg.barColor} shrink-0`} />
                    <div>
                      <p
                        data-testid="text-statusLabel"
                        className={`text-3xl sm:text-4xl font-black uppercase leading-none ${cfg.textColor}`}
                      >
                        {cfg.label}
                      </p>
                      <p className="text-muted-foreground text-sm mt-1.5">{cfg.subLabel}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section 4: Study Suggestions */}
              <Card className="border-border bg-card border">
                <CardHeader className="pb-3 pt-5 px-5">
                  <CardTitle className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
                    Action Plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <ul className="flex flex-col gap-2">
                    {suggestions[status].map((tip, index) => (
                      <li
                        key={index}
                        data-testid={`tip-item-${index}`}
                        className="flex gap-3 items-start border border-border bg-background px-4 py-3"
                      >
                        <span className={`font-mono text-xs font-bold mt-0.5 shrink-0 ${cfg.textColor}`}>
                          {padZero(index + 1)}
                        </span>
                        <span className="text-sm text-foreground leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          );
        })()}
      </div>
    </div>
  );
}
