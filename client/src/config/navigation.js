import {
  LayoutDashboard,
  Calendar,
  LineChart,
  Ticket,
  Radio,
  PlusCircle,
  Settings,
  User,
  LogOut,
  MessageSquare,
  Banknote,
  DollarSign,
  Shield,
  Heart,
  CreditCard,
  Users,
} from "lucide-react";

/**
 * Build navigation sections for sidebar / mobile drawer.
 * @param {{ user: object | null, openCreateEvent?: () => void }} ctx
 */
export function buildNavSections(ctx) {
  const { user, openCreateEvent } = ctx;
  if (!user) return { sections: [], footer: [], mobileTabs: [] };

  const isAdmin = user?.role === "admin" || user?.isAdmin === true;
  const isOrganizer = user?.role === "organizer" || user?.isOrganizer === true;
  const canOrganize = isAdmin || isOrganizer;
  const isFreeUser = user?.plan?.toLowerCase() === "free" || !user?.plan;

  // const profileUrl = user?.username ? `/user/${user.username}` : "/profile/me";
  const profileUrl = `/users/${user?.id ?? user?._id ?? ""}`;


  const sections = [
    {
      id: "primary",
      label: "Main",
      items: [
        ...(canOrganize
          ? [{ type: "link", to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }]
          : []),
        { type: "link", to: "/events", label: "Events", icon: Calendar },
        { type: "link", to: "/my-tickets", label: "My Tickets", icon: Ticket },
        ...(canOrganize && openCreateEvent
          ? [{ type: "action", label: "Create", icon: PlusCircle, primary: true, action: openCreateEvent }]
          : []),
      ],
    },
    {
      id: "discover",
      label: "Discover",
      items: [
        { type: "link", to: "/community", label: "Community", icon: Users },
        { type: "link", to: "/favorites", label: "Favorites", icon: Heart },
        { type: "link", to: "/live/events", label: "Live", icon: Radio },
      ],
    },
    ...(canOrganize
      ? [
          {
            id: "organizer",
            label: "Organizer",
            items: [
              { type: "link", to: "/analytics", label: "Analytics", icon: LineChart },
              { type: "link", to: "/earnings", label: "Earnings", icon: Banknote },
              { type: "link", to: "/team/invitations", label: "Team", icon: Users },
            ],
          },
        ]
      : []),
    {
      id: "account",
      label: "Account",
      items: [
        { type: "link", to: "/billing", label: "Billing", icon: CreditCard },
        { type: "link", to: "/messages", label: "Messages", icon: MessageSquare, component: "MessageIndicator" },
      ],
    },
    ...(isFreeUser
      ? [
          {
            id: "upgrade",
            label: "Upgrade",
            items: [{ type: "link", to: "/pricing", label: "Premium", icon: DollarSign, highlight: true }],
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            id: "admin",
            label: "Admin",
            items: [{ type: "link", to: "/admin/dashboard", label: "Admin", icon: Shield }],
          },
        ]
      : []),
  ];

  const footer = [
    { type: "notification", label: "Notifications" },
    { type: "link", to: profileUrl, label: "Profile", icon: User },
    { type: "link", to: "/settings", label: "Settings", icon: Settings },
    { type: "logout", label: "Logout", icon: LogOut },
  ];

  const mobileTabs = [
    ...(canOrganize ? [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] : []),
    { to: "/events", label: "Events", icon: Calendar },
    { to: "/my-tickets", label: "My tickets", icon: Ticket },
    { to: "/analytics", label: "Analytics", icon: LineChart },
    { to: "/messages", label: "Messages", icon: MessageSquare },
  ];

  return { sections, footer, mobileTabs, profileUrl, canOrganize, isFreeUser };
}
