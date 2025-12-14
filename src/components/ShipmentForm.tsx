import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Calculator, Save, Ship, MapPin, Container } from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import type { ShipmentRecord } from "../types/record"
import { useShipmentStore } from "../stores/use-shipments"
import { cn } from "../lib/utils"

// Schema
const shipmentSchema = z.object({
    bookingNo: z.string().min(1, "Booking No is required"),
    businessNo: z.string().min(1, "Business No is required"),
    shipper: z.string().min(1, "Shipper is required"),
    client: z.string().min(1, "Client is required"),
    fleet: z.string().optional(),

    loadingDate: z.string().optional(),
    sailingDate: z.string().optional(),
    arrivalDate: z.string().optional(),
    pol: z.string().min(1, "POL is required"),
    pod: z.string().min(1, "POD is required"),
    vesselName: z.string().optional(),
    containerType: z.string().min(1, "Container Type is required"),
    containerNo: z.string().min(1, "Container No is required"),

    // Costs & Prices
    oceanFreightCost: z.coerce.number().min(0).default(0),
    oceanFreightPrice: z.coerce.number().min(0).default(0),
    truckingFeeCost: z.coerce.number().min(0).default(0),
    truckingFeePrice: z.coerce.number().min(0).default(0),
    customsFeeCost: z.coerce.number().min(0).default(0),
    customsFeePrice: z.coerce.number().min(0).default(0),

    // Other Fees - Cost/Price Pairs
    thcCost: z.coerce.number().min(0).default(0),
    thcPrice: z.coerce.number().min(0).default(0),
    printingFeeCost: z.coerce.number().min(0).default(0),
    printingFeePrice: z.coerce.number().min(0).default(0),
    sealFeeCost: z.coerce.number().min(0).default(0),
    sealFeePrice: z.coerce.number().min(0).default(0),
    docFeeCost: z.coerce.number().min(0).default(0),
    docFeePrice: z.coerce.number().min(0).default(0),
    telexFeeCost: z.coerce.number().min(0).default(0),
    telexFeePrice: z.coerce.number().min(0).default(0),
    blFeeCost: z.coerce.number().min(0).default(0),
    blFeePrice: z.coerce.number().min(0).default(0),
    diffPickupFeeCost: z.coerce.number().min(0).default(0),
    diffPickupFeePrice: z.coerce.number().min(0).default(0),
    weighingFeeCost: z.coerce.number().min(0).default(0),
    weighingFeePrice: z.coerce.number().min(0).default(0),

    // Optional - Cost/Price Pairs
    vgmFeeCost: z.coerce.number().optional(),
    vgmFeePrice: z.coerce.number().optional(),
    amendmentFeeCost: z.coerce.number().optional(),
    amendmentFeePrice: z.coerce.number().optional(),
    detentionFeeCost: z.coerce.number().optional(),
    detentionFeePrice: z.coerce.number().optional(),
    demurrageFeeCost: z.coerce.number().optional(),
    demurrageFeePrice: z.coerce.number().optional(),
    handlingFeeCost: z.coerce.number().optional(),
    handlingFeePrice: z.coerce.number().optional(),
    insuranceFeeCost: z.coerce.number().optional(),
    insuranceFeePrice: z.coerce.number().optional(),

    exchangeRate: z.coerce.number().min(0.01).default(7.2),
    isSpecialDeclaration: z.boolean().default(false),
})

type ShipmentFormValues = z.infer<typeof shipmentSchema>

interface ShipmentFormProps {
    initialData?: ShipmentRecord
    onSuccess: () => void
}

export function ShipmentForm({ initialData, onSuccess }: ShipmentFormProps) {
    const addShipment = useShipmentStore((state) => state.addShipment)
    const updateShipment = useShipmentStore((state) => state.updateShipment)

    const form = useForm<ShipmentFormValues>({
        resolver: zodResolver(shipmentSchema),
        defaultValues: {
            bookingNo: "",
            businessNo: "",
            shipper: "",
            client: "",
            fleet: "",
            loadingDate: "",
            sailingDate: "",
            arrivalDate: "",
            pol: "",
            pod: "",
            vesselName: "",
            containerType: "",
            containerNo: "",
            oceanFreightCost: 0,
            oceanFreightPrice: 0,
            truckingFeeCost: 0,
            truckingFeePrice: 0,
            customsFeeCost: 0,
            customsFeePrice: 0,
            thcCost: 0,
            thcPrice: 0,
            printingFeeCost: 0,
            printingFeePrice: 0,
            sealFeeCost: 0,
            sealFeePrice: 0,
            docFeeCost: 0,
            docFeePrice: 0,
            telexFeeCost: 0,
            telexFeePrice: 0,
            blFeeCost: 0,
            blFeePrice: 0,
            diffPickupFeeCost: 0,
            diffPickupFeePrice: 0,
            weighingFeeCost: 0,
            weighingFeePrice: 0,
            vgmFeeCost: 0,
            vgmFeePrice: 0,
            amendmentFeeCost: 0,
            amendmentFeePrice: 0,
            detentionFeeCost: 0,
            detentionFeePrice: 0,
            demurrageFeeCost: 0,
            demurrageFeePrice: 0,
            handlingFeeCost: 0,
            handlingFeePrice: 0,
            insuranceFeeCost: 0,
            insuranceFeePrice: 0,
            exchangeRate: 7.2,
            isSpecialDeclaration: false,
        }
    })

    React.useEffect(() => {
        if (initialData) {
            form.reset({
                ...initialData,
                client: initialData.client || "",
                fleet: initialData.fleet || "",
                loadingDate: initialData.loadingDate || "",
                sailingDate: initialData.sailingDate || "",
                arrivalDate: initialData.arrivalDate || "",
                vesselName: initialData.vesselName || "",
                vgmFeeCost: initialData.vgmFeeCost || 0,
                vgmFeePrice: initialData.vgmFeePrice || 0,
                amendmentFeeCost: initialData.amendmentFeeCost || 0,
                amendmentFeePrice: initialData.amendmentFeePrice || 0,
                detentionFeeCost: initialData.detentionFeeCost || 0,
                detentionFeePrice: initialData.detentionFeePrice || 0,
                demurrageFeeCost: initialData.demurrageFeeCost || 0,
                demurrageFeePrice: initialData.demurrageFeePrice || 0,
                handlingFeeCost: initialData.handlingFeeCost || 0,
                handlingFeePrice: initialData.handlingFeePrice || 0,
                insuranceFeeCost: initialData.insuranceFeeCost || 0,
                insuranceFeePrice: initialData.insuranceFeePrice || 0,
            })
        } else {
            form.reset({
                bookingNo: "",
                businessNo: "",
                shipper: "",
                client: "",
                fleet: "",
                loadingDate: "",
                sailingDate: "",
                arrivalDate: "",
                pol: "",
                pod: "",
                vesselName: "",
                containerType: "",
                containerNo: "",
                oceanFreightCost: 0,
                oceanFreightPrice: 0,
                truckingFeeCost: 0,
                truckingFeePrice: 0,
                customsFeeCost: 0,
                customsFeePrice: 0,
                thcCost: 0,
                thcPrice: 0,
                printingFeeCost: 0,
                printingFeePrice: 0,
                sealFeeCost: 0,
                sealFeePrice: 0,
                docFeeCost: 0,
                docFeePrice: 0,
                telexFeeCost: 0,
                telexFeePrice: 0,
                blFeeCost: 0,
                blFeePrice: 0,
                diffPickupFeeCost: 0,
                diffPickupFeePrice: 0,
                weighingFeeCost: 0,
                weighingFeePrice: 0,
                vgmFeeCost: 0,
                vgmFeePrice: 0,
                amendmentFeeCost: 0,
                amendmentFeePrice: 0,
                detentionFeeCost: 0,
                detentionFeePrice: 0,
                demurrageFeeCost: 0,
                demurrageFeePrice: 0,
                handlingFeeCost: 0,
                handlingFeePrice: 0,
                insuranceFeeCost: 0,
                insuranceFeePrice: 0,
                exchangeRate: 7.2,
                isSpecialDeclaration: false,
            })
        }
    }, [initialData, form])

    const { register, watch, handleSubmit, getValues, formState: { errors } } = form

    const oceanCost = watch("oceanFreightCost") || 0
    const oceanPrice = watch("oceanFreightPrice") || 0
    const rate = watch("exchangeRate") || 7.2

    const estimatedProfit = React.useMemo(() => {
        const oceanProfitUSD = oceanPrice - oceanCost;
        const oceanProfitCNY = oceanProfitUSD * rate;

        const truckingProfit = (watch("truckingFeePrice") || 0) - (watch("truckingFeeCost") || 0)
        const customsProfit = (watch("customsFeePrice") || 0) - (watch("customsFeeCost") || 0)

        const values = getValues();
        let totalAdditionalProfit = 0;

        const feeKeys = [
            'thc', 'printingFee', 'sealFee', 'docFee', 'telexFee', 'blFee',
            'diffPickupFee', 'weighingFee', 'vgmFee', 'amendmentFee',
            'detentionFee', 'demurrageFee', 'handlingFee', 'insuranceFee'
        ];

        feeKeys.forEach(key => {
            const cost = Number(values[`${key}Cost` as keyof ShipmentFormValues] || 0);
            const price = Number(values[`${key}Price` as keyof ShipmentFormValues] || 0);
            totalAdditionalProfit += (price - cost);
        });

        return oceanProfitCNY + truckingProfit + customsProfit + totalAdditionalProfit;
    }, [oceanCost, oceanPrice, rate, watch(), JSON.stringify(watch())])

    const onSubmit = (data: ShipmentFormValues) => {
        if (initialData) {
            updateShipment(initialData.id, {
                ...data,
                bookingNo: data.bookingNo,
                businessNo: data.businessNo
            } as any)
        } else {
            addShipment({
                ...data,
                bookingNo: data.bookingNo,
                businessNo: data.businessNo
            } as any)
        }

        onSuccess()
    }

    return (
        <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6 max-w-7xl mx-auto"
        >
            {/* Top Header Area: Key Identifiers */}
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">New Shipment</h2>
                    <p className="text-muted-foreground text-sm">Create a new freight booking record.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" type="button" onClick={onSuccess}>Cancel</Button>
                    <Button type="submit" size="lg" className="bg-primary shadow-lg shadow-primary/20">
                        <Save className="w-4 h-4 mr-2" />
                        Save Record
                    </Button>
                </div>
            </div>

            {/* Main Visual Layout: Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* LEFT COLUMN (Route & Cargo) - Spans 9 cols */}
                <div className="lg:col-span-9 space-y-6">

                    {/* 1. The Route Timeline Card */}
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <CardHeader className="pb-4 bg-muted/20 border-b border-border/50">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600">
                                    <Ship className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Route Journey</CardTitle>
                                    <div className="text-xs text-muted-foreground font-mono mt-1">
                                        VESSEL: {watch("vesselName") || "TBA"}
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-8 pb-8">
                            {/* Visual Stepper */}
                            <div className="relative flex justify-between items-stretch gap-4 px-2 md:px-4">
                                {/* Connector Line */}
                                <div className="absolute left-4 right-4 top-12 h-0.5 bg-border/60 -z-10 md:left-12 md:right-12" />

                                {/* POL */}
                                <div className="flex flex-col items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-4 rounded-xl z-10 w-1/3 shadow-sm hover:shadow-md transition-all">
                                    <div className="w-10 h-10 rounded-full border-2 border-primary bg-background flex items-center justify-center shadow-sm shrink-0">
                                        <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                                    </div>
                                    <div className="text-center space-y-2 w-full">
                                        <div className="uppercase text-[10px] font-bold text-muted-foreground tracking-widest">Origin</div>
                                        <Input
                                            {...register("pol")}
                                            placeholder="Port of Loading"
                                            className="h-9 text-center font-semibold text-sm border-transparent hover:border-input focus:border-input bg-transparent transition-all px-0"
                                        />
                                        <div className="flex justify-center">
                                            <Input
                                                type="date"
                                                {...register("loadingDate")}
                                                className="h-7 text-[10px] text-center border-slate-200 bg-white/50 w-auto min-w-[110px]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Vessel Middle Point */}
                                <div className="flex flex-col items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-4 rounded-xl z-10 w-1/3 shadow-sm hover:shadow-md transition-all">
                                    <div className="w-10 h-10 rounded-full border bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm shrink-0">
                                        <Ship className="w-5 h-5 text-indigo-500" />
                                    </div>
                                    <div className="text-center space-y-2 w-full">
                                        <div className="uppercase text-[10px] font-bold text-muted-foreground tracking-widest">Sailing</div>
                                        <div className="flex justify-center">
                                            <Input
                                                type="date"
                                                {...register("sailingDate")}
                                                className="h-7 text-[10px] text-center border-slate-200 bg-white/50 w-auto min-w-[110px]"
                                            />
                                        </div>
                                        <Input
                                            {...register("vesselName")}
                                            placeholder="Vessel Name"
                                            className="h-8 text-center text-xs border-transparent hover:border-input focus:border-input bg-transparent px-0"
                                        />
                                    </div>
                                </div>

                                {/* POD */}
                                <div className="flex flex-col items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-4 rounded-xl z-10 w-1/3 shadow-sm hover:shadow-md transition-all">
                                    <div className="w-10 h-10 rounded-full border-2 border-slate-800 bg-slate-800 text-white flex items-center justify-center shadow-sm shrink-0">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div className="text-center space-y-2 w-full">
                                        <div className="uppercase text-[10px] font-bold text-muted-foreground tracking-widest">Destination</div>
                                        <Input
                                            {...register("pod")}
                                            placeholder="Port of Discharge"
                                            className="h-9 text-center font-semibold text-sm border-transparent hover:border-input focus:border-input bg-transparent transition-all px-0"
                                        />
                                        <div className="flex justify-center">
                                            <Input
                                                type="date"
                                                {...register("arrivalDate")}
                                                className="h-7 text-[10px] text-center border-slate-200 bg-white/50 w-auto min-w-[110px]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2. Primary Identifiers Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-base">Booking Details</CardTitle></CardHeader>
                            <CardContent className="grid gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Booking No.</Label>
                                    <Input {...register("bookingNo")} className="font-mono bg-muted/30" placeholder="Required" />
                                    {errors.bookingNo && <span className="text-xs text-destructive">{errors.bookingNo.message}</span>}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Business / Ref No.</Label>
                                    <Input {...register("businessNo")} className="font-mono bg-muted/30" placeholder="Required" />
                                    {errors.businessNo && <span className="text-xs text-destructive">{errors.businessNo.message}</span>}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-base">Parties</CardTitle></CardHeader>
                            <CardContent className="grid gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Client (客户)</Label>
                                    <Input {...register("client")} placeholder="Search client..." />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Shipper (发货人)</Label>
                                    <Input {...register("shipper")} placeholder="Full company name" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 3. Container Details */}
                    <Card>
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Container className="w-4 h-4" /> Container
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Container No</Label>
                                <Input {...register("containerNo")} className="uppercase" placeholder="ABCD1234567" />
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus:ring-1 focus:ring-ring"
                                    {...register("containerType")}
                                >
                                    <option value="">Select...</option>
                                    <option value="20GP">20GP</option>
                                    <option value="40GP">40GP</option>
                                    <option value="40HQ">40HQ</option>
                                    <option value="45HQ">45HQ</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Fleet / Driver</Label>
                                <Input {...register("fleet")} placeholder="Optional" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* 4. Detailed Fees */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider pl-1">Financial Breakdown</h3>

                        {/* Major Fees (Ocean, Trucking, Customs) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Ocean */}
                            {/* Ocean */}
                            <div className="rounded-lg border bg-card p-4 space-y-3 relative overflow-hidden group hover:border-indigo-400 transition-colors">
                                <div className="font-medium text-indigo-600">Ocean Freight (USD)</div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase">Cost</Label>
                                        <div className="relative">
                                            <span className="absolute left-2 top-2.5 text-xs text-muted-foreground">$</span>
                                            <Input type="number" step="0.01" {...register("oceanFreightCost")} className="h-9 pl-6" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase">Price</Label>
                                        <div className="relative">
                                            <span className="absolute left-2 top-2.5 text-xs text-muted-foreground">$</span>
                                            <Input type="number" step="0.01" {...register("oceanFreightPrice")} className="h-9 pl-6" />
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                                    <Ship className="w-12 h-12 text-indigo-600" />
                                </div>
                            </div>

                            {/* Trucking */}
                            <div className="rounded-lg border bg-card p-4 space-y-3 hover:border-orange-400 transition-colors">
                                <div className="font-medium text-orange-600">Trucking (拖车)</div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase">Cost</Label>
                                        <div className="relative">
                                            <span className="absolute left-2 top-2.5 text-xs text-muted-foreground">¥</span>
                                            <Input type="number" {...register("truckingFeeCost")} className="h-9 pl-6" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase">Price</Label>
                                        <div className="relative">
                                            <span className="absolute left-2 top-2.5 text-xs text-muted-foreground">¥</span>
                                            <Input type="number" {...register("truckingFeePrice")} className="h-9 pl-6" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Customs */}
                            <div className="rounded-lg border bg-card p-4 space-y-3 hover:border-emerald-400 transition-colors">
                                <div className="font-medium text-emerald-600">Customs (报关)</div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase">Cost</Label>
                                        <div className="relative">
                                            <span className="absolute left-2 top-2.5 text-xs text-muted-foreground">¥</span>
                                            <Input type="number" {...register("customsFeeCost")} className="h-9 pl-6" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase">Price</Label>
                                        <div className="relative">
                                            <span className="absolute left-2 top-2.5 text-xs text-muted-foreground">¥</span>
                                            <Input type="number" {...register("customsFeePrice")} className="h-9 pl-6" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Misc Fees Table */}
                        <Card>
                            <CardHeader className="py-3 px-4 bg-muted/30"><CardTitle className="text-sm">Additional Fees (CNY)</CardTitle></CardHeader>
                            <CardContent className="p-0">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                                    {[
                                        { label: "THC", key: "thc" },
                                        { label: "Printing (打单)", key: "printingFee" },
                                        { label: "Seal (封条)", key: "sealFee" },
                                        { label: "Doc (文件)", key: "docFee" },
                                        { label: "Telex (电放)", key: "telexFee" },
                                        { label: "B/L (提单)", key: "blFee" },
                                        { label: "Diff Pick (异提)", key: "diffPickupFee" },
                                        { label: "Weighing (过磅)", key: "weighingFee" },
                                        { label: "VGM", key: "vgmFee" },
                                        { label: "Amendment (改单)", key: "amendmentFee" },
                                        { label: "Detention (滞箱)", key: "detentionFee" },
                                        { label: "Demurrage (滞港)", key: "demurrageFee" },
                                        { label: "Handling (操作)", key: "handlingFee" },
                                        { label: "Insurance (保险)", key: "insuranceFee" },
                                    ].map((field) => (
                                        <div key={field.key} className="rounded-lg border bg-card p-4 space-y-3 hover:border-slate-400 transition-colors">
                                            <div className="font-medium text-slate-700 dark:text-slate-300">{field.label}</div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase text-muted-foreground">Cost</Label>
                                                    <div className="relative">
                                                        <span className="absolute left-2 top-2.5 text-xs text-muted-foreground">¥</span>
                                                        <Input
                                                            type="number"
                                                            {...register(`${field.key}Cost` as any)}
                                                            className="h-9 pl-6"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase text-muted-foreground">Price</Label>
                                                    <div className="relative">
                                                        <span className="absolute left-2 top-2.5 text-xs text-muted-foreground">¥</span>
                                                        <Input
                                                            type="number"
                                                            {...register(`${field.key}Price` as any)}
                                                            className="h-9 pl-6"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                </div>

                {/* RIGHT COLUMN (Summary & Profit) - Spans 3 cols */}
                <div className="lg:col-span-3 space-y-6">

                    {/* Profit Card - Sticky */}
                    <div className="sticky top-6 space-y-6">
                        <Card className="bg-slate-900 text-white border-0 shadow-xl overflow-hidden relative">
                            <div className="absolute -right-6 -top-6 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-30"></div>
                            <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-emerald-500 rounded-full blur-3xl opacity-20"></div>

                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-indigo-300">
                                    <Calculator className="w-5 h-5" />
                                    Estimated Profit
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <div className="text-xs text-slate-400 mb-1">Total Net Profit (CNY)</div>
                                    <div className={cn("text-3xl font-bold font-mono tracking-tighter truncate", estimatedProfit < 0 ? "text-red-400" : "text-emerald-400")}>
                                        ¥ <Counter value={estimatedProfit} />
                                    </div>
                                </div>

                                <div className="space-y-2 pt-4 border-t border-slate-700/50">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-400">Exchange Rate</span>
                                        <div className="flex items-center gap-1 w-20">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                {...register("exchangeRate")}
                                                className="h-6 text-right bg-slate-800 border-slate-700 text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Special Actions */}
                        <Card>
                            <CardHeader><CardTitle className="text-sm">Settings</CardTitle></CardHeader>
                            <CardContent>
                                <div className="flex items-center space-x-2 p-2 rounded hover:bg-muted transition-colors">
                                    <input
                                        type="checkbox"
                                        id="special"
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        {...register("isSpecialDeclaration")}
                                    />
                                    <Label htmlFor="special" className="cursor-pointer text-sm font-normal">Special Declaration (特报)</Label>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </div>
        </motion.form>
    )
}

function Counter({ value }: { value: number }) {
    return <>{value.toFixed(2)}</>
}
