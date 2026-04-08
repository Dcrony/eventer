import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Calendar, Ticket } from "lucide-react";

/** Unsplash — stable editorial-style photos */
const IMG_SALES =
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80";
const IMG_CALENDAR =
  "https://images.unsplash.com/photo-1611224923853-80b023f02d71?auto=format&fit=crop&w=1400&q=80";

export function Features() {
  return (
    <div className="mx-auto max-w-2xl px-0 sm:px-2 lg:max-w-5xl">
      <div className="mx-auto grid gap-4 lg:grid-cols-2">
        <FeatureCard>
          <CardHeader className="space-y-0 p-0 pb-3">
            <CardHeading
              icon={Ticket}
              title="Live revenue & payouts"
              description="See ticket sales, refunds, and payouts in real time—from one dashboard."
            />
          </CardHeader>

          <div className="relative mb-6 border-t border-dashed border-border sm:mb-0">
            <div className="absolute inset-0 [background:radial-gradient(125%_125%_at_50%_0%,transparent_40%,hsl(var(--muted)),white_125%)]" />
            <div className="aspect-[76/59] p-1 px-6">
              <FeatureImage src={IMG_SALES} alt="Ticketing analytics dashboard" />
            </div>
          </div>
        </FeatureCard>

        <FeatureCard>
          <CardHeader className="space-y-0 p-0 pb-3">
            <CardHeading
              icon={Calendar}
              title="Calendar & sessions"
              description="Plan multi-day events, time slots, and reminder emails without friction."
            />
          </CardHeader>

          <CardContent>
            <div className="relative mb-6 sm:mb-0">
              <div className="absolute -inset-6 [background:radial-gradient(50%_50%_at_75%_50%,transparent,hsl(var(--background))_100%)]" />
              <div className="aspect-[76/59] border border-border">
                <FeatureImage
                  src={IMG_CALENDAR}
                  alt="Event calendar and scheduling"
                />
              </div>
            </div>
          </CardContent>
        </FeatureCard>

        <FeatureCard className="p-6 lg:col-span-2">
          <p className="mx-auto my-6 max-w-md text-balance text-center text-2xl font-semibold text-foreground">
            Smart reminders for attendees, staff, and sponsors—before and during
            your event.
          </p>

          <div className="flex justify-center gap-6 overflow-hidden">
            <CircularUI
              label="GA"
              circles={[{ pattern: "border" }, { pattern: "border" }]}
            />

            <CircularUI
              label="VIP"
              circles={[{ pattern: "none" }, { pattern: "none" }]}
            />

            <CircularUI
              label="Early bird"
              circles={[{ pattern: "none" }, { pattern: "primary" }]}
            />

            <CircularUI
              label="Waitlist"
              circles={[{ pattern: "primary" }, { pattern: "none" }]}
              className="hidden sm:block"
            />
          </div>
        </FeatureCard>
      </div>
    </div>
  );
}

function FeatureCard({ children, className }) {
  return (
    <Card
      className={cn(
        "features-showcase-card group relative rounded-none shadow-zinc-950/5",
        className,
      )}
    >
      <CardDecorator />
      {children}
    </Card>
  );
}

function CardDecorator() {
  return (
    <>
      <span className="border-primary absolute -left-px -top-px block size-2 border-l-2 border-t-2" />
      <span className="border-primary absolute -right-px -top-px block size-2 border-r-2 border-t-2" />
      <span className="border-primary absolute -bottom-px -left-px block size-2 border-b-2 border-l-2" />
      <span className="border-primary absolute -bottom-px -right-px block size-2 border-b-2 border-r-2" />
    </>
  );
}

function CardHeading({ icon: Icon, title, description }) {
  return (
    <div className="p-6">
      <span className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
        <Icon className="size-4 text-primary" strokeWidth={2} />
        {title}
      </span>
      <p className="mt-6 text-2xl font-semibold leading-snug text-foreground md:mt-8">
        {description}
      </p>
    </div>
  );
}

function FeatureImage({ src, alt, className }) {
  return (
    <img
      src={src}
      className={cn(
        "h-full w-full rounded-sm object-cover object-center shadow-sm",
        className,
      )}
      alt={alt}
      loading="lazy"
      decoding="async"
    />
  );
}

function circlePatternClass(pattern) {
  const base = "size-7 rounded-full sm:size-8";
  switch (pattern) {
    case "none":
      return cn(
        base,
        "border border-primary bg-background",
      );
    case "border":
      return cn(
        base,
        "border border-primary bg-[repeating-linear-gradient(-45deg,hsl(var(--border)),hsl(var(--border))_1px,transparent_1px,transparent_4px)]",
      );
    case "primary":
      return cn(
        base,
        "border border-primary bg-background bg-[repeating-linear-gradient(-45deg,hsl(var(--primary)),hsl(var(--primary))_1px,transparent_1px,transparent_4px)]",
      );
    default:
      return cn(base, "border border-border");
  }
}

function CircularUI({ label, circles, className }) {
  return (
    <div className={className}>
      <div className="from-border size-fit rounded-2xl bg-gradient-to-b to-transparent p-px">
        <div className="from-background to-muted/25 relative flex aspect-square w-fit items-center -space-x-4 rounded-[15px] bg-gradient-to-b p-4">
          {circles.map((circle, i) => (
            <div
              key={i}
              className={circlePatternClass(circle.pattern)}
            />
          ))}
        </div>
      </div>
      <span className="text-muted-foreground mt-1.5 block text-center text-sm">
        {label}
      </span>
    </div>
  );
}
