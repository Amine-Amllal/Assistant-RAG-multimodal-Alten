/**
 * Maps Clerk's themable surface onto the ALTEN design tokens (src/styles/theme.css).
 * Values reference CSS variables directly so there is no hex duplication.
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: "var(--alten-red)",
    colorText: "var(--gray-900)",
    colorTextOnPrimaryBackground: "var(--alten-white)",
    colorBackground: "var(--alten-white)",
    colorInputBackground: "var(--alten-white)",
    colorInputText: "var(--gray-900)",
    colorDanger: "var(--alten-red)",
    fontFamily: "var(--font-family)",
    borderRadius: "var(--radius-md)",
  },
  elements: {
    card: {
      boxShadow: "var(--shadow-md)",
      border: "var(--border-hairline)",
    },
    headerTitle: {
      color: "var(--alten-black)",
      fontWeight: "var(--fw-bold)",
    },
    formButtonPrimary: {
      backgroundColor: "var(--alten-red)",
      "&:hover": {
        backgroundColor: "var(--alten-red-hover)",
      },
    },
    formFieldInput: {
      borderColor: "var(--gray-300)",
      "&:focus": {
        borderColor: "var(--alten-black)",
        boxShadow: "var(--focus-ring)",
      },
    },
    footerActionLink: {
      color: "var(--alten-blue)",
    },
  },
};
