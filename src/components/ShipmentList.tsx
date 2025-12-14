import * as React from "react"
import { useShipmentStore } from "../stores/use-shipments"
import { loadChineseFont } from "../lib/pdf-font"
import { FileText, Trash2, Edit, Download, Search, Filter, ChevronDown, Users } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Document, Packer, Paragraph, Table as DocxTable, TableCell as DocxTableCell, TableRow as DocxTableRow, WidthType, TextRun } from "docx"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Checkbox } from "./ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import type { ShipmentRecord } from "../types/record"

interface ShipmentListProps {
    onEdit?: (record: ShipmentRecord) => void
}

export function ShipmentList({ onEdit }: ShipmentListProps) {
    const shipments = useShipmentStore((state) => state.shipments)
    const deleteShipment = useShipmentStore((state) => state.deleteShipment)

    const deleteShipments = useShipmentStore((state) => state.deleteShipments)

    const [searchQuery, setSearchQuery] = React.useState("")
    const [filterType, setFilterType] = React.useState<string>("all")
    const [clientFilter, setClientFilter] = React.useState<string>("all")
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())

    const uniqueClients = React.useMemo(() => {
        return Array.from(new Set(shipments.map(s => s.client))).filter(Boolean).sort()
    }, [shipments])

    const filteredShipments = React.useMemo(() => {
        return shipments.filter(item => {
            const matchesSearch =
                item.bookingNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.businessNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.containerNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.shipper.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.client && item.client.toLowerCase().includes(searchQuery.toLowerCase()))

            const matchesFilter = filterType === "all" || item.containerType === filterType
            const matchesClient = clientFilter === "all" || item.client === clientFilter

            return matchesSearch && matchesFilter && matchesClient
        })
    }, [shipments, searchQuery, filterType, clientFilter])

    // Reset selection when filter changes to avoid confusion, or keep it (user usually expects keep, but easy implementation: keep)

    // Select All
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(filteredShipments.map(s => s.id)))
        } else {
            setSelectedIds(new Set())
        }
    }

    const handleSelectOne = (id: string, checked: boolean) => {
        const next = new Set(selectedIds)
        if (checked) {
            next.add(id)
        } else {
            next.delete(id)
        }
        setSelectedIds(next)
    }

    const calculateTotalProfit = (record: any) => {
        const rate = record.exchangeRate || 7.2
        const oceanProfit = ((record.oceanFreightPrice || 0) - (record.oceanFreightCost || 0)) * rate
        const truckingProfit = (record.truckingFeePrice || 0) - (record.truckingFeeCost || 0)
        const customsProfit = (record.customsFeePrice || 0) - (record.customsFeeCost || 0)

        const feeKeys = [
            'thc', 'printingFee', 'sealFee', 'docFee', 'telexFee', 'blFee',
            'diffPickupFee', 'weighingFee', 'vgmFee', 'amendmentFee',
            'detentionFee', 'demurrageFee', 'handlingFee', 'insuranceFee'
        ];

        let additionalProfit = 0;
        feeKeys.forEach(key => {
            const cost = Number(record[`${key}Cost`] || 0);
            const price = Number(record[`${key}Price`] || 0);
            additionalProfit += (price - cost);
        });

        return oceanProfit + truckingProfit + customsProfit + additionalProfit
    }

    const getExportTargets = () => {
        return selectedIds.size > 0
            ? filteredShipments.filter(s => selectedIds.has(s.id))
            : filteredShipments
    }

    const handleBatchExportPDF = async () => {
        const doc = new jsPDF()

        // Load Font
        const fontName = await loadChineseFont(doc)
        doc.setFont(fontName)

        const targets = getExportTargets()

        // Single Item Selected -> Detail Export
        if (selectedIds.size === 1) {
            const item = targets[0]
            doc.setFontSize(18)
            doc.text("Shipment Detail", 14, 22)

            doc.setFontSize(12)
            const leftX = 14
            const rightX = 105

            // Basic Info - Left Column
            doc.text(`Booking No: ${item.bookingNo}`, leftX, 40)
            doc.text(`Business No: ${item.businessNo}`, leftX, 50)
            doc.text(`Shipper: ${item.shipper}`, leftX, 60)
            doc.text(`Fleet/Trucking: ${item.fleet || '-'}`, leftX, 70)

            // Logistics - Right Column (aligned roughly)
            doc.text(`Container: ${item.containerNo} (${item.containerType})`, rightX, 40)
            doc.text(`Route: ${item.pol} -> ${item.pod}`, rightX, 50)
            doc.text(`Vessel: ${item.vesselName || '-'}`, rightX, 60)
            doc.text(`Special Decl.: ${item.isSpecialDeclaration ? 'Yes' : 'No'}`, rightX, 70)

            doc.text(`Loading Date: ${item.loadingDate || '-'}`, leftX, 85)
            doc.text(`Sailing Date: ${item.sailingDate || '-'}`, rightX, 85)

            // Financials - Profit Centers
            const profit = calculateTotalProfit(item)
            let currentY = 100

            doc.setFontSize(14)
            doc.text("Profit Summary", leftX, currentY)
            currentY += 5

            autoTable(doc, {
                startY: currentY,
                head: [['Item', 'Cost', 'Price', 'Profit']],
                body: [
                    ['Ocean Freight', `\$${item.oceanFreightCost}`, `\$${item.oceanFreightPrice}`, `¥ ${((item.oceanFreightPrice - item.oceanFreightCost) * (item.exchangeRate || 7.2)).toFixed(2)}`],
                    ['Trucking', `¥${item.truckingFeeCost}`, `¥${item.truckingFeePrice}`, `¥ ${(item.truckingFeePrice - item.truckingFeeCost).toFixed(2)}`],
                    ['Customs', `¥${item.customsFeeCost}`, `¥${item.customsFeePrice}`, `¥ ${(item.customsFeePrice - item.customsFeeCost).toFixed(2)}`],
                ],
                foot: [['', '', 'Total Est. Profit:', `¥ ${profit.toFixed(2)}`]],
                headStyles: { fillColor: [63, 81, 181] },
                styles: { font: fontName, fontStyle: 'normal' },
                theme: 'grid'
            })

            // @ts-ignore
            currentY = doc.lastAutoTable.finalY + 15

            // Other Fees Table
            const feeFields = [
                { k: 'thc', l: 'THC' }, { k: 'printingFee', l: 'Printing' }, { k: 'sealFee', l: 'Seal' },
                { k: 'docFee', l: 'Doc' }, { k: 'telexFee', l: 'Telex' }, { k: 'blFee', l: 'B/L' },
                { k: 'diffPickupFee', l: 'Diff Pickup' }, { k: 'weighingFee', l: 'Weighing' }, { k: 'vgmFee', l: 'VGM' },
                { k: 'amendmentFee', l: 'Amendment' }, { k: 'detentionFee', l: 'Detention' }, { k: 'demurrageFee', l: 'Demurrage' },
                { k: 'handlingFee', l: 'Handling' }, { k: 'insuranceFee', l: 'Insurance' }
            ]

            const activeFees = feeFields
                // @ts-ignore
                .filter(f => (Number(item[`${f.k}Cost`]) > 0 || Number(item[`${f.k}Price`]) > 0))
                .map(f => {
                    // @ts-ignore
                    const cost = Number(item[`${f.k}Cost`] || 0);
                    // @ts-ignore
                    const price = Number(item[`${f.k}Price`] || 0);
                    return [
                        f.l,
                        `¥ ${cost.toFixed(2)}`,
                        `¥ ${price.toFixed(2)}`,
                        `¥ ${(price - cost).toFixed(2)}`
                    ];
                })

            if (activeFees.length > 0) {
                doc.setFontSize(14)
                doc.text("Additional Fees Breakdown", leftX, currentY)
                currentY += 5

                autoTable(doc, {
                    startY: currentY,
                    head: [['Fee Type', 'Cost', 'Price', 'Profit']],
                    body: activeFees,
                    headStyles: { fillColor: [100, 100, 100] },
                    styles: { font: fontName, fontStyle: 'normal' },
                    theme: 'grid',
                    // Make it narrower
                    tableWidth: 120
                })
            }

            doc.save(`shipment_${item.bookingNo}_detail.pdf`)
            return
        }

        // Batch/None Selected -> List Export
        const title = selectedIds.size > 0 ? "Selected Shipments Report" : "Shipment Report List"

        doc.setFontSize(18)
        doc.text(title, 14, 22)
        doc.setFontSize(10)
        doc.text(`Generated: ${new Date().toLocaleDateString()} - ${targets.length} Records`, 14, 30)

        const tableData = targets.map(item => [
            item.bookingNo,
            item.businessNo,
            item.containerNo,
            item.shipper,
            `${item.pol} -> ${item.pod}`,
            item.loadingDate,
            `¥ ${calculateTotalProfit(item).toFixed(2)}`
        ])

        autoTable(doc, {
            head: [['Booking', 'Business', 'Container', 'Shipper', 'Route', 'Loading', 'Profit']],
            body: tableData,
            startY: 35,
            styles: { fontSize: 8, font: fontName, fontStyle: 'normal' },
            headStyles: { fillColor: [63, 81, 181] }
        })

        doc.save(selectedIds.size > 0 ? "selected_shipments.pdf" : "shipments_list.pdf")
    }

    const handleBatchExportWord = async () => {
        const targets = getExportTargets()

        // Single Item Selected -> Detail Export
        if (selectedIds.size === 1) {
            const item = targets[0]
            const profit = calculateTotalProfit(item)

            // Fee Processing
            const feeFields = [
                { k: 'thc', l: 'THC' }, { k: 'printingFee', l: 'Printing' }, { k: 'sealFee', l: 'Seal' },
                { k: 'docFee', l: 'Doc' }, { k: 'telexFee', l: 'Telex' }, { k: 'blFee', l: 'B/L' },
                { k: 'diffPickupFee', l: 'Diff Pickup' }, { k: 'weighingFee', l: 'Weighing' }, { k: 'vgmFee', l: 'VGM' },
                { k: 'amendmentFee', l: 'Amendment' }, { k: 'detentionFee', l: 'Detention' }, { k: 'demurrageFee', l: 'Demurrage' },
                { k: 'handlingFee', l: 'Handling' }, { k: 'insuranceFee', l: 'Insurance' }
            ]

            const activeFees = feeFields
                // @ts-ignore
                .filter(f => (Number(item[`${f.k}Cost`]) > 0 || Number(item[`${f.k}Price`]) > 0))
                .map(f => {
                    // @ts-ignore
                    const cost = Number(item[`${f.k}Cost`] || 0);
                    // @ts-ignore
                    const price = Number(item[`${f.k}Price`] || 0);
                    return [
                        f.l,
                        `¥ ${cost.toFixed(2)}`,
                        `¥ ${price.toFixed(2)}`,
                        `¥ ${(price - cost).toFixed(2)}`
                    ];
                })

            const doc = new Document({
                sections: [{
                    children: [
                        new Paragraph({ children: [new TextRun({ text: "Shipment Detail", bold: true, size: 36 })], spacing: { after: 200 } }),

                        // Info Grid Simulation (using Tabs or just lines)
                        new Paragraph({ children: [new TextRun({ text: `Booking: ${item.bookingNo}   |   Business: ${item.businessNo}`, size: 24 })] }),
                        new Paragraph({ children: [new TextRun({ text: `Shipper: ${item.shipper}   |   Fleet: ${item.fleet || '-'}`, size: 24 })] }),
                        new Paragraph({ children: [new TextRun({ text: `Container: ${item.containerNo} (${item.containerType})`, size: 24 })], spacing: { before: 100 } }),
                        new Paragraph({ children: [new TextRun({ text: `Route: ${item.pol} -> ${item.pod}`, size: 24 })] }),
                        new Paragraph({ children: [new TextRun({ text: `Vessel: ${item.vesselName || '-'}`, size: 24 })] }),
                        new Paragraph({ children: [new TextRun({ text: `Loading: ${item.loadingDate || '-'}   |   Sailing: ${item.sailingDate || '-'}`, size: 24 })], spacing: { after: 200 } }),

                        new Paragraph({ children: [new TextRun({ text: "Profit Summary", bold: true, size: 28 })], spacing: { after: 200 } }),

                        new DocxTable({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            rows: [
                                new DocxTableRow({
                                    children: ["Item", "Cost", "Price", "Profit"].map(t => new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: t, bold: true })] })] }))
                                }),
                                new DocxTableRow({
                                    children: ["Ocean Freight", `\$${item.oceanFreightCost}`, `\$${item.oceanFreightPrice}`, `¥ ${((item.oceanFreightPrice - item.oceanFreightCost) * (item.exchangeRate || 7.2)).toFixed(2)}`].map(t => new DocxTableCell({ children: [new Paragraph(String(t))] }))
                                }),
                                new DocxTableRow({
                                    children: ["Trucking", `¥${item.truckingFeeCost}`, `¥${item.truckingFeePrice}`, `¥ ${(item.truckingFeePrice - item.truckingFeeCost).toFixed(2)}`].map(t => new DocxTableCell({ children: [new Paragraph(String(t))] }))
                                }),
                                new DocxTableRow({
                                    children: ["Customs", `¥${item.customsFeeCost}`, `¥${item.customsFeePrice}`, `¥ ${(item.customsFeePrice - item.customsFeeCost).toFixed(2)}`].map(t => new DocxTableCell({ children: [new Paragraph(String(t))] }))
                                }),
                                new DocxTableRow({
                                    children: [
                                        new DocxTableCell({ children: [new Paragraph("")] }),
                                        new DocxTableCell({ children: [new Paragraph("")] }),
                                        new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Total Profit:", bold: true })] })] }),
                                        new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: `¥ ${profit.toFixed(2)}`, bold: true, color: profit >= 0 ? "006400" : "FF0000" })] })] })
                                    ]
                                })
                            ]
                        }),

                        ...(activeFees.length > 0 ? [
                            new Paragraph({ children: [new TextRun({ text: "Additional Fees Breakdown", bold: true, size: 28 })], spacing: { after: 200, before: 200 } }),
                            new DocxTable({
                                width: { size: 90, type: WidthType.PERCENTAGE },
                                rows: [
                                    new DocxTableRow({
                                        children: ["Fee Type", "Cost", "Price", "Profit"].map(t => new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: t, bold: true })] })] }))
                                    }),
                                    ...activeFees.map(row => new DocxTableRow({
                                        children: row.map(t => new DocxTableCell({ children: [new Paragraph(String(t))] }))
                                    }))
                                ]
                            })
                        ] : [])
                    ]
                }]
            })

            const blob = await Packer.toBlob(doc)
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = `shipment_${item.bookingNo}_detail.docx`
            link.click()
            return
        }

        // Batch Export
        const title = selectedIds.size > 0 ? "Selected Shipments Report" : "Shipment Report List"

        const tableRows = [
            new DocxTableRow({
                children: [
                    "Booking", "Business", "Container", "Shipper", "Route", "Loading", "Profit"
                ].map(text => new DocxTableCell({
                    children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })],
                    width: { size: 100 / 7, type: WidthType.PERCENTAGE }
                }))
            }),
            ...targets.map(item => new DocxTableRow({
                children: [
                    item.bookingNo,
                    item.businessNo,
                    item.containerNo,
                    item.shipper,
                    `${item.pol} -> ${item.pod}`,
                    item.loadingDate || "-",
                    `¥ ${calculateTotalProfit(item).toFixed(2)}`
                ].map(text => new DocxTableCell({ children: [new Paragraph(text)] }))
            }))
        ]

        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 28 })], spacing: { after: 200 } }),
                    new Paragraph({ children: [new TextRun({ text: `Generated: ${new Date().toLocaleDateString()} - ${targets.length} Records` })], spacing: { after: 200 } }),
                    new DocxTable({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } })
                ]
            }]
        })

        const blob = await Packer.toBlob(doc)
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = selectedIds.size > 0 ? "selected_shipments.docx" : "shipments_list.docx"
        link.click()
    }

    const handleBatchDelete = () => {
        if (confirm(`Are you sure you want to delete ${selectedIds.size} shipments?`)) {
            deleteShipments(Array.from(selectedIds))
            setSelectedIds(new Set())
        }
    }

    if (shipments.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center p-12 text-center border rounded-lg border-dashed"
            >
                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No shipments recorded</h3>
                <p className="text-sm text-muted-foreground mt-1">Create your first entry to get started.</p>
            </motion.div>
        )
    }

    const allSelected = filteredShipments.length > 0 && selectedIds.size === filteredShipments.length
    const isIndeterminate = selectedIds.size > 0 && selectedIds.size < filteredShipments.length

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
                <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                    <div className="relative flex-1 sm:max-w-[100px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search..."
                            className="pl-9 h-9 rounded-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <select
                            className="h-9 rounded-full border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-9 pr-8 appearance-none"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="all">All Types</option>
                            <option value="20GP">20GP</option>
                            <option value="40GP">40GP</option>
                            <option value="40HQ">40HQ</option>
                            <option value="45HQ">45HQ</option>
                        </select>
                        <ChevronDown className="absolute right-2.5 top-3 h-3 w-3 text-muted-foreground opacity-50 pointer-events-none" />
                    </div>

                    <div className="relative">
                        <Users className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <select
                            className="h-9 rounded-full border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-9 pr-8 appearance-none max-w-[150px]"
                            value={clientFilter}
                            onChange={(e) => setClientFilter(e.target.value)}
                        >
                            <option value="all">All Clients</option>
                            {uniqueClients.map(client => (
                                <option key={client} value={client}>{client}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-3 h-3 w-3 text-muted-foreground opacity-50 pointer-events-none" />
                    </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                        variant="destructive"
                        onClick={handleBatchDelete}
                        disabled={selectedIds.size === 0}
                        className="rounded-full h-8 px-4 gap-2 text-xs"
                    >
                        <Trash2 className="w-3 h-3" />
                        批量删除 {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="rounded-full h-8 px-4 gap-2 text-xs">
                                <Download className="w-3 h-3" />
                                导出 {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
                                <ChevronDown className="w-3 h-3 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleBatchExportPDF}>
                                <FileText className="w-4 h-4 mr-2" />
                                导出 PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleBatchExportWord}>
                                <FileText className="w-4 h-4 mr-2" />
                                导出 Word
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="rounded-md border bg-card text-card-foreground shadow-sm">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="[&_tr]:border-b bg-muted/30">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 w-12 px-4 align-middle text-center">
                                    <Checkbox
                                        checked={allSelected || (isIndeterminate ? "indeterminate" : false)}
                                        onCheckedChange={(val) => handleSelectAll(!!val)}
                                        className="translate-y-[2px]"
                                    />
                                </th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-center">Business No</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-center">Client</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-center">Ref</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-center">Route</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-center">Dates</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-center">Profit (Est)</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            <AnimatePresence>
                                {filteredShipments.map((item, index) => {
                                    const profit = calculateTotalProfit(item)
                                    return (
                                        <motion.tr
                                            key={item.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.2, delay: index * 0.05 }}
                                            className="border-b transition-colors hover:bg-muted/50"
                                        >
                                            <td className="p-4 align-middle text-center">
                                                <div className="flex justify-center">
                                                    <Checkbox
                                                        checked={selectedIds.has(item.id)}
                                                        onCheckedChange={(val) => handleSelectOne(item.id, !!val)}
                                                    />
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle text-center">
                                                <div className="font-medium text-indigo-600 dark:text-indigo-400">{item.businessNo}</div>
                                            </td>
                                            <td className="p-4 align-middle text-center">
                                                {item.client ? (
                                                    <div className="text-xs font-medium text-orange-600 dark:text-orange-400 flex items-center justify-center gap-1">
                                                        <Users className="w-3 h-3" />
                                                        {item.client}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="p-4 align-middle text-center">
                                                <div className="font-medium">{item.containerNo}</div>
                                                <div className="text-xs text-muted-foreground">{item.containerType} • {item.shipper}</div>
                                            </td>
                                            <td className="p-4 align-middle text-xs text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <span className="font-semibold">{item.pol}</span>
                                                    <span className="text-muted-foreground">→</span>
                                                    <span className="font-semibold">{item.pod}</span>
                                                </div>
                                                <div className="text-muted-foreground mt-0.5">{item.vesselName}</div>
                                            </td>
                                            <td className="p-4 align-middle text-xs text-muted-foreground text-center">
                                                <div className="flex flex-col items-center">
                                                    <span>L: {item.loadingDate || '-'}</span>
                                                    <span>S: {item.sailingDate || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle text-center font-mono">
                                                <div className={profit >= 0 ? "text-green-600 dark:text-green-500" : "text-red-500"}>
                                                    ¥ {profit.toFixed(2)}
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => onEdit?.(item)}
                                                        className="p-2 hover:bg-primary/10 hover:text-primary rounded-md transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteShipment(item.id)}
                                                        className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    )
                                })}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
