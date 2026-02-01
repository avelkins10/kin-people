"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface CreateDealModalProps {
  children: React.ReactNode;
}

export function CreateDealModal({ children }: CreateDealModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [people, setPeople] = useState<
    Array<{ id: string; firstName: string; lastName: string; name: string }>
  >([]);
  const [offices, setOffices] = useState<Array<{ id: string; name: string }>>([]);
  const router = useRouter();

  const [formData, setFormData] = useState({
    customerName: "",
    customerAddress: "",
    customerEmail: "",
    customerPhone: "",
    dealType: "",
    systemSizeKw: "",
    ppw: "",
    dealValue: "",
    saleDate: "",
    closeDate: "",
    setterId: "",
    closerId: "",
    officeId: "",
    status: "sold",
  });

  const [calculatedValue, setCalculatedValue] = useState<number | null>(null);
  const isSelfGen = formData.setterId && formData.setterId === formData.closerId;

  useEffect(() => {
    if (open) {
      fetchOptions();
    }
  }, [open]);

  async function fetchOptions() {
    try {
      const [peopleRes, officesRes] = await Promise.all([
        fetch("/api/people"),
        fetch("/api/offices?active=true"),
      ]);

      if (peopleRes.ok) {
        const data = await peopleRes.json();
        setPeople(data);
      }
      if (officesRes.ok) {
        const data = await officesRes.json();
        setOffices(data);
      }
    } catch (error) {
      console.error("Error fetching options:", error);
    }
  }

  // Auto-calculate deal value when systemSizeKw and ppw are entered
  useEffect(() => {
    if (formData.systemSizeKw && formData.ppw) {
      const kw = parseFloat(formData.systemSizeKw);
      const pricePerWatt = parseFloat(formData.ppw);
      if (!isNaN(kw) && !isNaN(pricePerWatt) && kw > 0 && pricePerWatt > 0) {
        const calculated = kw * pricePerWatt * 1000;
        setCalculatedValue(calculated);
        if (!formData.dealValue || parseFloat(formData.dealValue) === 0) {
          setFormData((prev) => ({ ...prev, dealValue: calculated.toString() }));
        }
      }
    } else {
      setCalculatedValue(null);
    }
  }, [formData.systemSizeKw, formData.ppw]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to create deal");
        return;
      }

      const result = await response.json();
      const commissionCount = result.commissionCount || 0;

      router.refresh();
      setOpen(false);
      setFormData({
        customerName: "",
        customerAddress: "",
        customerEmail: "",
        customerPhone: "",
        dealType: "",
        systemSizeKw: "",
        ppw: "",
        dealValue: "",
        saleDate: "",
        closeDate: "",
        setterId: "",
        closerId: "",
        officeId: "",
        status: "sold",
      });
      setCalculatedValue(null);

      // Show success message
      alert(`Deal created successfully. ${commissionCount} commission(s) calculated.`);
    } catch (error) {
      console.error("Error creating deal:", error);
      alert("Failed to create deal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>{children}</div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Deal</DialogTitle>
            <DialogDescription>
              Create a new deal and automatically calculate commissions.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6 py-4">
              {/* Customer Info */}
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-4">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) =>
                        setFormData({ ...formData, customerName: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerEmail">Email</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, customerEmail: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">Phone</Label>
                    <Input
                      id="customerPhone"
                      value={formData.customerPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, customerPhone: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="customerAddress">Address</Label>
                    <Input
                      id="customerAddress"
                      value={formData.customerAddress}
                      onChange={(e) =>
                        setFormData({ ...formData, customerAddress: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Deal Details */}
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-4">Deal Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dealType">Deal Type *</Label>
                    <Select
                      value={formData.dealType}
                      onValueChange={(value) =>
                        setFormData({ ...formData, dealType: value })
                      }
                    >
                      <SelectTrigger id="dealType">
                        <SelectValue placeholder="Select deal type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solar">Solar</SelectItem>
                        <SelectItem value="hvac">HVAC</SelectItem>
                        <SelectItem value="roofing">Roofing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="officeId">Office</Label>
                    <Select
                      value={formData.officeId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, officeId: value })
                      }
                    >
                      <SelectTrigger id="officeId">
                        <SelectValue placeholder="Select office" />
                      </SelectTrigger>
                      <SelectContent>
                        {offices.map((office) => (
                          <SelectItem key={office.id} value={office.id}>
                            {office.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="systemSizeKw">System Size (kW)</Label>
                    <Input
                      id="systemSizeKw"
                      type="number"
                      step="0.01"
                      value={formData.systemSizeKw}
                      onChange={(e) =>
                        setFormData({ ...formData, systemSizeKw: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="ppw">Price Per Watt ($)</Label>
                    <Input
                      id="ppw"
                      type="number"
                      step="0.0001"
                      value={formData.ppw}
                      onChange={(e) =>
                        setFormData({ ...formData, ppw: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="dealValue">Deal Value ($) *</Label>
                    <Input
                      id="dealValue"
                      type="number"
                      step="0.01"
                      value={formData.dealValue}
                      onChange={(e) =>
                        setFormData({ ...formData, dealValue: e.target.value })
                      }
                      required
                    />
                    {calculatedValue && (
                      <p className="text-xs text-gray-500 mt-1">
                        Auto-calculated: ${calculatedValue.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sold">Sold</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="permitted">Permitted</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="installed">Installed</SelectItem>
                        <SelectItem value="pto">PTO</SelectItem>
                        <SelectItem value="complete">Complete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-4">Dates</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="saleDate">Sale Date</Label>
                    <Input
                      id="saleDate"
                      type="date"
                      value={formData.saleDate}
                      onChange={(e) =>
                        setFormData({ ...formData, saleDate: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="closeDate">Close Date</Label>
                    <Input
                      id="closeDate"
                      type="date"
                      value={formData.closeDate}
                      onChange={(e) =>
                        setFormData({ ...formData, closeDate: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Participants */}
              <div>
                <h3 className="font-semibold mb-4">Participants</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="setterId">Setter *</Label>
                    <Select
                      value={formData.setterId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, setterId: value })
                      }
                    >
                      <SelectTrigger id="setterId">
                        <SelectValue placeholder="Select setter" />
                      </SelectTrigger>
                      <SelectContent>
                        {people.map((person) => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="closerId">Closer *</Label>
                    <Select
                      value={formData.closerId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, closerId: value })
                      }
                    >
                      <SelectTrigger id="closerId">
                        <SelectValue placeholder="Select closer" />
                      </SelectTrigger>
                      <SelectContent>
                        {people.map((person) => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {isSelfGen && (
                  <div className="mt-2">
                    <Badge variant="outline">Self Gen Deal</Badge>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.setterId || !formData.closerId || !formData.dealType || !formData.dealValue}
              >
                {loading ? "Creating..." : "Create Deal"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
