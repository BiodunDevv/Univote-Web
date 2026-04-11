import { ChangingLoadingState } from "@/components/shared/changing-loading-state";

export default function StudentsLoading() {
  return (
    <ChangingLoadingState
      fullHeight
      messages={[
        "Opening Univote...",
        "Preparing student access...",
        "Taking you to sign in...",
      ]}
    />
  );
}
