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
import { Badge } from "@/components/ui/badge";

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

export default function Home() {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [status, setStatus] = useState<"Safe" | "Risky" | "Critical" | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      examDateTime: localStorage.getItem("examDateTime") || "",
      subjectName: localStorage.getItem("subjectName") || "",
      chaptersRemaining: localStorage.getItem("chaptersRemaining") ? Number(localStorage.getItem("chaptersRemaining")) : 1,
      prepLevel: (localStorage.getItem("prepLevel") as any) || undefined,
    },
  });

  const { watch } = form;
  const examDateTimeValue = watch("examDateTime");

  useEffect(() => {
    document.documentElement.classList.add('dark');
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

    const intervalId = setInterval(() => {
      const now = new Date();
      const target = new Date(examDateTimeValue);
      const diffSeconds = differenceInSeconds(target, now);

      if (diffSeconds <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(intervalId);
        return;
      }

      const days = Math.floor(diffSeconds / (3600 * 24));
      const hours = Math.floor((diffSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((diffSeconds % 3600) / 60);
      const seconds = diffSeconds % 60;

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [examDateTimeValue]);

  function calculateStatus(data: FormValues) {
    if (!timeLeft) return;

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

  const suggestions = {
    Safe: [
      "Review your notes chapter by chapter",
      "Do practice questions for each chapter",
      "Get 8 hours of sleep tonight",
      "Make a brief summary sheet"
    ],
    Risky: [
      "Skip detailed reading — focus on key concepts only",
      "Prioritize the most important chapters first",
      "Use the 20/80 rule: 20% of content = 80% of exam",
      "Take 10-min breaks every hour"
    ],
    Critical: [
      "Drop everything — open your notes NOW",
      "Focus only on chapter summaries and headings",
      "Write down formulas and key definitions only",
      "Attempt past exam papers immediately",
      "Skip sleep only as last resort — 4 hours minimum"
    ]
  };

  const padZero = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 font-sans">
      <div className="max-w-[700px] mx-auto flex flex-col gap-6">
        
        {/* Section 1: Exam Countdown Timer */}
        <Card className="border-border bg-card rounded-none border">
          <CardHeader className="pb-4">
            <CardTitle className="text-muted-foreground text-sm uppercase tracking-widest">Exam Countdown</CardTitle>
          </CardHeader>
          <CardContent>
            {timeLeft ? (
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="flex flex-col border border-border p-4 bg-background">
                  <span className="text-4xl sm:text-5xl font-bold font-mono text-primary">{padZero(timeLeft.days)}</span>
                  <span className="text-xs text-muted-foreground mt-2 uppercase">Days</span>
                </div>
                <div className="flex flex-col border border-border p-4 bg-background">
                  <span className="text-4xl sm:text-5xl font-bold font-mono text-primary">{padZero(timeLeft.hours)}</span>
                  <span className="text-xs text-muted-foreground mt-2 uppercase">Hours</span>
                </div>
                <div className="flex flex-col border border-border p-4 bg-background">
                  <span className="text-4xl sm:text-5xl font-bold font-mono text-primary">{padZero(timeLeft.minutes)}</span>
                  <span className="text-xs text-muted-foreground mt-2 uppercase">Mins</span>
                </div>
                <div className="flex flex-col border border-border p-4 bg-background">
                  <span className="text-4xl sm:text-5xl font-bold font-mono text-primary">{padZero(timeLeft.seconds)}</span>
                  <span className="text-xs text-muted-foreground mt-2 uppercase">Secs</span>
                </div>
              </div>
            ) : (
              <div className="border border-border p-8 text-center bg-background text-muted-foreground">
                Set exam date below to start the timer
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 2: Study Planner Form */}
        <Card className="border-border bg-card rounded-none border">
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm uppercase tracking-widest">Flight Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(calculateStatus)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="examDateTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-xs tracking-wider text-muted-foreground">Exam Date & Time</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" className="rounded-none border-input focus-visible:ring-0 bg-background font-mono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subjectName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-xs tracking-wider text-muted-foreground">Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Thermodynamics" className="rounded-none border-input focus-visible:ring-0 bg-background font-mono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="chaptersRemaining"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-xs tracking-wider text-muted-foreground">Chapters Left</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} className="rounded-none border-input focus-visible:ring-0 bg-background font-mono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="prepLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-xs tracking-wider text-muted-foreground">Prep Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-none border-input focus:ring-0 bg-background font-mono">
                              <SelectValue placeholder="Select status..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-none border-border">
                            {PREP_LEVELS.map((level) => (
                              <SelectItem key={level} value={level} className="font-mono rounded-none">
                                {level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Button type="submit" className="w-full rounded-none font-bold uppercase tracking-widest text-lg h-14 bg-primary text-primary-foreground hover:bg-primary/90">
                  Assess Situation
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {status && (
          <>
            {/* Section 3: Panic Status Badge */}
            <Card className={`border rounded-none ${status === 'Critical' ? 'border-destructive bg-destructive/10' : status === 'Risky' ? 'border-primary bg-primary/10' : 'border-green-500 bg-green-500/10'}`}>
              <CardContent className="p-8 text-center flex flex-col items-center justify-center">
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] mb-4 text-muted-foreground">Current Status</h2>
                {status === "Safe" && <div className="text-2xl sm:text-3xl font-black text-green-500 uppercase">SAFE — You have got this</div>}
                {status === "Risky" && <div className="text-2xl sm:text-3xl font-black text-primary uppercase">RISKY — Focus now</div>}
                {status === "Critical" && <div className="text-2xl sm:text-3xl font-black text-destructive uppercase">CRITICAL — Emergency mode</div>}
              </CardContent>
            </Card>

            {/* Section 4: Quick Study Suggestions */}
            <Card className="border-border bg-card rounded-none border">
              <CardHeader>
                <CardTitle className="text-muted-foreground text-sm uppercase tracking-widest">Action Protocol</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {suggestions[status].map((tip, index) => (
                    <li key={index} className="flex gap-4 items-start border border-border p-4 bg-background">
                      <span className="font-mono text-primary text-sm mt-0.5">[{padZero(index + 1)}]</span>
                      <span className="font-mono leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}