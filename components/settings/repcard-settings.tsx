"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { useOffices, useRegions, useRoles } from "@/hooks/use-people-data";
import {
  useRepcardRegionMappings,
  useRepcardOfficeMappings,
  useRepcardRoleMappings,
  useRepcardPermissions,
  useRepcardOptions,
  useUpdateRepcardRegionMappings,
  useUpdateRepcardOfficeMappings,
  useUpdateRepcardRoleMappings,
  useUpdateRepcardPermissions,
} from "@/hooks/use-repcard-data";

const NONE_VALUE = "__none__";

// ---------------------------------------------------------------------------
// Region Mappings: Kin Region → RepCard Office
// ---------------------------------------------------------------------------

function RegionMappingsSection() {
  const { data: kinRegions = [] } = useRegions();
  const { data: mappingsData = [], isLoading } = useRepcardRegionMappings();
  const { data: rcOptions, isLoading: loadingOptions } = useRepcardOptions();
  const updateMutation = useUpdateRepcardRegionMappings();

  const [edits, setEdits] = useState<Record<string, string>>({});

  const rcOffices = rcOptions?.offices ?? [];

  function getMapping(regionId: string): string {
    if (edits[regionId] !== undefined) return edits[regionId];
    const existing = mappingsData.find(
      (m: { region: { id: string }; mapping: { repcardOffice: string } }) =>
        m.region.id === regionId
    );
    return existing?.mapping?.repcardOffice ?? "";
  }

  function handleSave() {
    const mappings = kinRegions
      .map((region) => {
        const repcardOffice = getMapping(region.id);
        if (!repcardOffice) return null;
        return { regionId: region.id, repcardOffice };
      })
      .filter(Boolean) as Array<{ regionId: string; repcardOffice: string }>;

    updateMutation.mutate(mappings, {
      onSuccess: () => setEdits({}),
    });
  }

  if (isLoading || loadingOptions) {
    return (
      <div className="flex items-center gap-2 py-8 justify-center text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 pr-4 font-medium text-gray-500">Kin Region</th>
              <th className="pb-2 font-medium text-gray-500">RepCard Office</th>
            </tr>
          </thead>
          <tbody>
            {kinRegions.map((region) => (
              <tr key={region.id} className="border-b">
                <td className="py-2 pr-4 font-medium">{region.name}</td>
                <td className="py-2">
                  <Select
                    value={getMapping(region.id) || NONE_VALUE}
                    onValueChange={(v) =>
                      setEdits((prev) => ({ ...prev, [region.id]: v === NONE_VALUE ? "" : v }))
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select RepCard office" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>-- None --</SelectItem>
                      {rcOffices.map((rc) => (
                        <SelectItem key={rc.id} value={rc.officeName}>
                          {rc.officeName}
                          {rc.officeState ? ` (${rc.officeState})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button onClick={handleSave} disabled={updateMutation.isPending}>
        {updateMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : (
          <Save className="h-4 w-4 mr-1" />
        )}
        Save Region Mappings
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Office Mappings: Kin Office → RepCard Team
// ---------------------------------------------------------------------------

function OfficeMappingsSection() {
  const { data: kinOffices = [] } = useOffices();
  const { data: kinRegions = [] } = useRegions();
  const { data: mappingsData = [], isLoading } = useRepcardOfficeMappings();
  const { data: regionMappingsData = [] } = useRepcardRegionMappings();
  const { data: rcOptions, isLoading: loadingOptions } = useRepcardOptions();
  const updateMutation = useUpdateRepcardOfficeMappings();

  const [edits, setEdits] = useState<Record<string, string>>({});

  const rcTeams = rcOptions?.teams ?? [];

  // Build a lookup: regionId → repcardOffice name
  const regionToRcOffice: Record<string, string> = {};
  for (const rm of regionMappingsData) {
    const rmTyped = rm as { region: { id: string }; mapping: { repcardOffice: string } };
    regionToRcOffice[rmTyped.region.id] = rmTyped.mapping.repcardOffice;
  }

  function getMapping(officeId: string): string {
    if (edits[officeId] !== undefined) return edits[officeId];
    const existing = mappingsData.find(
      (m: { office: { id: string }; mapping: { repcardTeam?: string | null } }) =>
        m.office.id === officeId
    );
    return existing?.mapping?.repcardTeam ?? "";
  }

  // Get RepCard teams filtered by the office's region mapping
  function getTeamsForOffice(office: { regionId: string | null }) {
    if (!office.regionId) return rcTeams;
    const rcOfficeName = regionToRcOffice[office.regionId];
    if (!rcOfficeName) return rcTeams;
    return rcTeams.filter((t) => t.officeName === rcOfficeName);
  }

  // Get region name for display
  function getRegionName(regionId: string | null) {
    if (!regionId) return null;
    return kinRegions.find((r) => r.id === regionId)?.name ?? null;
  }

  function handleSave() {
    const mappings = kinOffices
      .map((office) => {
        const repcardTeam = getMapping(office.id);
        if (!repcardTeam) return null;
        // Also save the RepCard office derived from region mapping
        const rcOfficeName = office.regionId ? regionToRcOffice[office.regionId] : undefined;
        return {
          officeId: office.id,
          repcardOffice: rcOfficeName || "",
          repcardTeam,
        };
      })
      .filter(Boolean) as Array<{ officeId: string; repcardOffice: string; repcardTeam?: string }>;

    updateMutation.mutate(mappings, {
      onSuccess: () => setEdits({}),
    });
  }

  if (isLoading || loadingOptions) {
    return (
      <div className="flex items-center gap-2 py-8 justify-center text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 pr-4 font-medium text-gray-500">Kin Office</th>
              <th className="pb-2 pr-4 font-medium text-gray-500">Region</th>
              <th className="pb-2 font-medium text-gray-500">RepCard Team</th>
            </tr>
          </thead>
          <tbody>
            {kinOffices.map((office) => {
              const regionName = getRegionName(office.regionId);
              const availableTeams = getTeamsForOffice(office);
              const hasRegionMapping = office.regionId && regionToRcOffice[office.regionId];
              return (
                <tr key={office.id} className="border-b">
                  <td className="py-2 pr-4 font-medium">{office.name}</td>
                  <td className="py-2 pr-4 text-gray-500">{regionName ?? "—"}</td>
                  <td className="py-2">
                    <Select
                      value={getMapping(office.id) || NONE_VALUE}
                      onValueChange={(v) =>
                        setEdits((prev) => ({ ...prev, [office.id]: v === NONE_VALUE ? "" : v }))
                      }
                      disabled={!hasRegionMapping}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue
                          placeholder={hasRegionMapping ? "Select RepCard team" : "Map region first"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>-- None --</SelectItem>
                        {availableTeams.map((t) => (
                          <SelectItem key={t.id} value={t.teamName}>
                            {t.teamName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Button onClick={handleSave} disabled={updateMutation.isPending}>
        {updateMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : (
          <Save className="h-4 w-4 mr-1" />
        )}
        Save Office Mappings
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Role Mappings: Kin Role → RepCard Role
// ---------------------------------------------------------------------------

function RoleMappingsSection() {
  const { data: roles = [] } = useRoles();
  const { data: mappingsData = [], isLoading } = useRepcardRoleMappings();
  const { data: rcOptions, isLoading: loadingOptions } = useRepcardOptions();
  const updateMutation = useUpdateRepcardRoleMappings();

  const rcRoles = rcOptions?.roles ?? [];
  const [edits, setEdits] = useState<Record<string, string>>({});

  function getMapping(roleId: string): string {
    if (edits[roleId] !== undefined) return edits[roleId];
    const existing = mappingsData.find(
      (m: { role: { id: string }; mapping: { repcardRole: string } }) => m.role.id === roleId
    );
    return existing?.mapping?.repcardRole ?? "";
  }

  function handleSave() {
    const mappings = roles
      .map((role) => {
        const repcardRole = getMapping(role.id);
        if (!repcardRole) return null;
        return { roleId: role.id, repcardRole };
      })
      .filter(Boolean) as Array<{ roleId: string; repcardRole: string }>;

    updateMutation.mutate(mappings, {
      onSuccess: () => setEdits({}),
    });
  }

  if (isLoading || loadingOptions) {
    return (
      <div className="flex items-center gap-2 py-8 justify-center text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 pr-4 font-medium text-gray-500">Kin Role</th>
              <th className="pb-2 font-medium text-gray-500">RepCard Role</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id} className="border-b">
                <td className="py-2 pr-4 font-medium">{role.name}</td>
                <td className="py-2">
                  <Select
                    value={getMapping(role.id) || NONE_VALUE}
                    onValueChange={(v) =>
                      setEdits((prev) => ({ ...prev, [role.id]: v === NONE_VALUE ? "" : v }))
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select RepCard role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>-- None --</SelectItem>
                      {rcRoles.map((rc) => (
                        <SelectItem key={rc.id} value={rc.name}>
                          {rc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button onClick={handleSave} disabled={updateMutation.isPending}>
        {updateMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : (
          <Save className="h-4 w-4 mr-1" />
        )}
        Save Role Mappings
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Permissions Tab
// ---------------------------------------------------------------------------

function PermissionsSection() {
  const { data: roles = [] } = useRoles();
  const { data: permsData = [], isLoading } = useRepcardPermissions();
  const updateMutation = useUpdateRepcardPermissions();

  type PermKey = "canCreate" | "canEdit" | "canDeactivate" | "canLink" | "canSync";
  const [edits, setEdits] = useState<Record<string, Record<PermKey, boolean>>>({});

  function getPerm(roleId: string): Record<PermKey, boolean> {
    if (edits[roleId]) return edits[roleId];
    const existing = permsData.find(
      (p: { role: { id: string }; permission: Record<PermKey, boolean> }) => p.role.id === roleId
    );
    return {
      canCreate: existing?.permission?.canCreate ?? false,
      canEdit: existing?.permission?.canEdit ?? false,
      canDeactivate: existing?.permission?.canDeactivate ?? false,
      canLink: existing?.permission?.canLink ?? false,
      canSync: existing?.permission?.canSync ?? false,
    };
  }

  function togglePerm(roleId: string, key: PermKey) {
    const current = getPerm(roleId);
    setEdits((prev) => ({
      ...prev,
      [roleId]: { ...current, [key]: !current[key] },
    }));
  }

  function handleSave() {
    const permissions = roles.map((role) => ({
      roleId: role.id,
      ...getPerm(role.id),
    }));
    updateMutation.mutate(permissions, {
      onSuccess: () => setEdits({}),
    });
  }

  const permKeys: { key: PermKey; label: string }[] = [
    { key: "canCreate", label: "Create" },
    { key: "canEdit", label: "Edit" },
    { key: "canDeactivate", label: "Deactivate" },
    { key: "canLink", label: "Link" },
    { key: "canSync", label: "Sync" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 justify-center text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 pr-4 font-medium text-gray-500">Role</th>
              {permKeys.map((pk) => (
                <th key={pk.key} className="pb-2 px-2 font-medium text-gray-500 text-center">
                  {pk.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => {
              const perms = getPerm(role.id);
              return (
                <tr key={role.id} className="border-b">
                  <td className="py-2 pr-4 font-medium">{role.name}</td>
                  {permKeys.map((pk) => (
                    <td key={pk.key} className="py-2 px-2 text-center">
                      <Checkbox
                        checked={perms[pk.key]}
                        onCheckedChange={() => togglePerm(role.id, pk.key)}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Button onClick={handleSave} disabled={updateMutation.isPending}>
        {updateMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : (
          <Save className="h-4 w-4 mr-1" />
        )}
        Save Permissions
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status Overview Tab
// ---------------------------------------------------------------------------

function StatusSection() {
  return (
    <div className="text-sm text-gray-500">
      <p>
        RepCard account status overview is available on individual person profiles
        under the Software Access tab. Navigate to a person&apos;s profile to view and manage
        their RepCard account status.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Settings Component
// ---------------------------------------------------------------------------

export function RepcardSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">RepCard Integration</h2>
        <p className="text-sm text-gray-500">
          Map Kin regions, offices, and roles to their RepCard equivalents.
        </p>
      </div>

      <Tabs defaultValue="mappings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="mappings">Mappings</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
        </TabsList>

        <TabsContent value="mappings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Region Mappings</CardTitle>
              <CardDescription>
                Kin regions map to RepCard offices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RegionMappingsSection />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Office Mappings</CardTitle>
              <CardDescription>
                Kin offices map to RepCard teams (filtered by region mapping above)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OfficeMappingsSection />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Role Mappings</CardTitle>
            </CardHeader>
            <CardContent>
              <RoleMappingsSection />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">RepCard Permissions by Role</CardTitle>
            </CardHeader>
            <CardContent>
              <PermissionsSection />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusSection />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
