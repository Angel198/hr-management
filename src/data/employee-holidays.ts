import type { LucideIcon } from "lucide-react";
import { Calendar, ClipboardList, Sparkles, Users } from "lucide-react";

export type EmployeeHolidayCategory = "Company" | "Birthday" | "Event";

export type EmployeeHoliday = {
  id: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  icon: LucideIcon;
  category: EmployeeHolidayCategory;
  gradient: string;
};

export const EMPLOYEE_HOLIDAYS: EmployeeHoliday[] = [
  {
    id: "holiday-1",
    title: "Presentation of the new department",
    dateLabel: "Today",
    timeLabel: "6:00 PM",
    icon: Users,
    category: "Company",
    gradient: "from-primary/15 via-primary/10 to-transparent",
  },
  {
    id: "holiday-2",
    title: "Anna’s Birthday",
    dateLabel: "Today",
    timeLabel: "5:00 PM",
    icon: Sparkles,
    category: "Birthday",
    gradient:
      "from-purple-100 via-purple-50 to-transparent dark:from-purple-900/30 dark:via-purple-900/10",
  },
  {
    id: "holiday-3",
    title: "Meeting with Development Team",
    dateLabel: "Tomorrow",
    timeLabel: "5:00 PM",
    icon: ClipboardList,
    category: "Company",
    gradient:
      "from-amber-100 via-amber-50 to-transparent dark:from-amber-900/30 dark:via-amber-900/10",
  },
  {
    id: "holiday-4",
    title: "Ray’s Birthday",
    dateLabel: "Tomorrow",
    timeLabel: "2:00 PM",
    icon: Sparkles,
    category: "Birthday",
    gradient:
      "from-fuchsia-100 via-fuchsia-50 to-transparent dark:from-fuchsia-900/30 dark:via-fuchsia-900/10",
  },
  {
    id: "holiday-5",
    title: "Meeting with CEO",
    dateLabel: "Sep 14",
    timeLabel: "5:00 PM",
    icon: Users,
    category: "Company",
    gradient:
      "from-sky-100 via-sky-50 to-transparent dark:from-sky-900/30 dark:via-sky-900/10",
  },
  {
    id: "holiday-6",
    title: "Movie night (Tenet)",
    dateLabel: "Sep 15",
    timeLabel: "5:00 PM",
    icon: Calendar,
    category: "Event",
    gradient:
      "from-indigo-100 via-indigo-50 to-transparent dark:from-indigo-900/30 dark:via-indigo-900/10",
  },
  {
    id: "holiday-7",
    title: "Lucas’s Birthday",
    dateLabel: "Sep 29",
    timeLabel: "5:30 PM",
    icon: Sparkles,
    category: "Birthday",
    gradient:
      "from-pink-100 via-pink-50 to-transparent dark:from-pink-900/30 dark:via-pink-900/10",
  },
  {
    id: "holiday-8",
    title: "Meeting with CTO",
    dateLabel: "Sep 30",
    timeLabel: "12:00 PM",
    icon: Users,
    category: "Company",
    gradient:
      "from-blue-100 via-blue-50 to-transparent dark:from-blue-900/30 dark:via-blue-900/10",
  },
];


