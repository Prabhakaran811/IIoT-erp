import {
  LayoutDashboard, Users, FolderKanban, 
  type LucideIcon,
  Truck,
  Wrench, Receipt, CalendarDays,
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Business",
    items: [
      { label: "Customers", path: "/customers", icon: Users },
      { label: "Projects", path: "/projects", icon: FolderKanban },
      { label: "Service Reports", path: "/service-reports", icon: Wrench },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Delivery Challans", path: "/delivery-challans", icon: Truck },
      { label: "Service Bills", path: "/service-bills", icon: Receipt },
      { label: "Customer Payments", path: "/customer-payments", icon: Receipt },
    ],
  },
  {
    title: "HR",
    items: [
      { label: "Employees", path: "/employees", icon: Users },
      { label: "Leave Management", path: "/leave-management", icon: CalendarDays },
    ],
  },
];