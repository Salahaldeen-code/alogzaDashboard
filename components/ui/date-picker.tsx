"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  value?: string;
  onChange: (date: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
  defaultMonth?: string;
  className?: string;
  id?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  min,
  max,
  defaultMonth,
  className,
  id,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const date = value ? new Date(value) : undefined;

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Format as YYYY-MM-DD for the input
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      onChange(formattedDate);
      setOpen(false);
    } else {
      onChange(undefined);
    }
  };

  // Convert min/max strings to Date objects for the calendar
  const minDate = min ? new Date(min) : undefined;
  const maxDate = max ? new Date(max) : undefined;
  const fallbackDefaultMonth = minDate ?? date ?? undefined;
  const defaultMonthDate = (defaultMonth ? new Date(defaultMonth) : undefined) ?? fallbackDefaultMonth;

  // Normalize to local midnight to avoid timezone off-by-one.
  const minTime = minDate
    ? new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()).getTime()
    : undefined;
  const maxTime = maxDate
    ? new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate()).getTime()
    : undefined;

  const disabledDays = (day: Date) => {
    if (disabled) return true;
    const t = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
    if (minTime !== undefined && t < minTime) return true;
    if (maxTime !== undefined && t > maxTime) return true;
    return false;
  };

  const CustomDayButton = (props: any) => {
    const { day, modifiers, ...buttonProps } = props;
    const t = new Date(
      day.date.getFullYear(),
      day.date.getMonth(),
      day.date.getDate()
    ).getTime();

    const isOutOfPeriod =
      (minTime !== undefined && t < minTime) ||
      (maxTime !== undefined && t > maxTime);

    if (modifiers?.disabled && isOutOfPeriod) {
      return (
        <button
          {...buttonProps}
          title="This date is out of the project period"
        />
      );
    }

    return <button {...buttonProps} />;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            disabled && "cursor-not-allowed opacity-50",
            className || "h-11"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          disabled={disabledDays}
          fromDate={minDate}
          toDate={maxDate}
          defaultMonth={defaultMonthDate}
          initialFocus
          showOutsideDays={true}
          components={{
            DayButton: CustomDayButton,
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

