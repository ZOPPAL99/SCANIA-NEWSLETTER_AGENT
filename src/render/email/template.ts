export interface EmailTheme {
  fontFamily: string;
  textColor: string;
  backgroundColor: string;
  surfaceColor: string;
  mutedTextColor: string;
  accentColor: string;
}

export const defaultEmailTheme: EmailTheme = {
  fontFamily: "Arial, Helvetica, sans-serif",
  textColor: "#1F2937",
  backgroundColor: "#F4F6F8",
  surfaceColor: "#FFFFFF",
  mutedTextColor: "#6B7280",
  accentColor: "#0F766E"
};

export const baseContainerStyle =
  "margin:0;padding:0;background-color:#F4F6F8;width:100%;";
