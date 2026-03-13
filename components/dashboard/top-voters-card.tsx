import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardTopVoter } from "@/components/dashboard/shared/types";

type TopVotersCardProps = {
  topVoters: DashboardTopVoter[];
};

export function TopVotersCard({ topVoters }: TopVotersCardProps) {
  return (
    <Card className="border shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Top Voters</CardTitle>
        <Trophy className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topVoters.length > 0 ? (
            topVoters.map((voter, index) => (
              <div key={voter.matric_no} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {index + 1}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium">
                    {voter.full_name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {voter.matric_no}
                  </p>
                </div>
                <div className="text-xs font-medium">
                  {voter.votes_cast} votes
                </div>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No votes recorded yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
