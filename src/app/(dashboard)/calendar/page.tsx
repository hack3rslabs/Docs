"use client";

import { Card } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useState } from "react";

const Calendar = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Calendar</h1>
        <p className="text-muted-foreground">Manage your schedule and events</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 bg-white shadow-card border-0">
          <h3 className="text-lg font-semibold text-foreground mb-4">Select Date</h3>
          <CalendarComponent
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
          />
        </Card>

        <Card className="lg:col-span-2 p-6 bg-white shadow-card border-0">
          <h3 className="text-lg font-semibold text-foreground mb-4">Upcoming Events</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-dashboard-bg">
              <div className="w-3 h-3 bg-black rounded-full"></div>
              <div>
                <p className="font-medium">Team Meeting</p>
                <p className="text-sm text-muted-foreground">Today, 2:00 PM</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-dashboard-bg">
              <div className="w-3 h-3 bg-zinc-400 rounded-full"></div>
              <div>
                <p className="font-medium">Project Review</p>
                <p className="text-sm text-muted-foreground">Tomorrow, 10:00 AM</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-dashboard-bg">
              <div className="w-3 h-3 bg-zinc-300 rounded-full"></div>
              <div>
                <p className="font-medium">Client Presentation</p>
                <p className="text-sm text-muted-foreground">Friday, 3:00 PM</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Calendar;