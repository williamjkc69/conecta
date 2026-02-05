import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store } from "lucide-react";

import { TITLES, MESSAGES } from "@/constants/text";

const AdminRetail = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-slate-100">
        {TITLES.RETAIL_PARAMS}
      </h2>
      <Card className="bg-slate-800/50 border-slate-700 text-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-6 h-6 text-yellow-400" />
            {TITLES.FEATURE_IN_DEVELOPMENT}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400">{MESSAGES.RETAIL_NOT_IMPLEMENTED}</p>
          <p className="mt-2 text-slate-500 text-sm">{MESSAGES.RETAIL_DESC}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRetail;
