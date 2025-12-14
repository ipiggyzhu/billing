import * as React from "react"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts"
import { format, parseISO, startOfWeek } from "date-fns"
import { useShipmentStore } from "../stores/use-shipments"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Box, DollarSign, Calendar, TrendingUp, TrendingDown, MapPin, Users } from "lucide-react"
import { Button } from "./ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { cn } from "../lib/utils"

type ViewMode = 'day' | 'week' | 'month'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function StatsView() {
    const shipments = useShipmentStore((state) => state.shipments)
    const [viewMode, setViewMode] = React.useState<ViewMode>('month')
    const [selectedYear, setSelectedYear] = React.useState<number>(new Date().getFullYear())

    // derived unique years
    const availableYears = React.useMemo(() => {
        const years = new Set<number>()
        years.add(new Date().getFullYear())
        shipments.forEach(s => {
            const d = s.loadingDate ? parseISO(s.loadingDate) : new Date(s.createdAt)
            years.add(d.getFullYear())
        })
        return Array.from(years).sort((a, b) => b - a)
    }, [shipments])

    // Filter by Year
    const yearShipments = React.useMemo(() => {
        return shipments.filter(s => {
            const d = s.loadingDate ? parseISO(s.loadingDate) : new Date(s.createdAt)
            return d.getFullYear() === selectedYear
        })
    }, [shipments, selectedYear])

    // --- AGGREGATIONS ---

    // 1. Annual Totals + MoM Growth
    const { vol, profit, volGrowth, profitGrowth } = React.useMemo(() => {
        let currentVol = 0; let currentProfit = 0;

        // Let's Calculate TOTALS for the Selected Year
        yearShipments.forEach(s => {
            currentVol += 1
            const rate = s.exchangeRate || 7.2
            const ocean = ((s.oceanFreightPrice || 0) - (s.oceanFreightCost || 0)) * rate
            const truck = (s.truckingFeePrice || 0) - (s.truckingFeeCost || 0)
            const customs = (s.customsFeePrice || 0) - (s.customsFeeCost || 0)
            currentProfit += (ocean + truck + customs)
        })

        // For MoM, let's find the latest month with data in the selected year
        if (yearShipments.length === 0) return { vol: 0, profit: 0, volGrowth: 0, profitGrowth: 0 }

        // Group by month to find latest
        const monthlyStats = new Map<string, { vol: number, profit: number }>()
        yearShipments.forEach(s => {
            const d = s.loadingDate ? parseISO(s.loadingDate) : new Date(s.createdAt)
            const k = format(d, 'yyyy-MM')
            if (!monthlyStats.has(k)) monthlyStats.set(k, { vol: 0, profit: 0 })
            const e = monthlyStats.get(k)!
            e.vol += 1
            const rate = s.exchangeRate || 7.2
            const p = (((s.oceanFreightPrice || 0) - (s.oceanFreightCost || 0)) * rate) + ((s.truckingFeePrice || 0) - (s.truckingFeeCost || 0)) + ((s.customsFeePrice || 0) - (s.customsFeeCost || 0))
            e.profit += p
        })

        const sortedMonths = Array.from(monthlyStats.keys()).sort()
        const latestMonth = sortedMonths[sortedMonths.length - 1]
        const prevMonth = sortedMonths[sortedMonths.length - 2] // Might be undefined

        if (!latestMonth || !prevMonth) return { vol: currentVol, profit: currentProfit, volGrowth: 0, profitGrowth: 0 }

        const curr = monthlyStats.get(latestMonth)!
        const prev = monthlyStats.get(prevMonth)!

        const vGrowth = prev.vol === 0 ? 100 : ((curr.vol - prev.vol) / prev.vol) * 100
        const pGrowth = prev.profit === 0 ? 100 : ((curr.profit - prev.profit) / prev.profit) * 100

        return { vol: currentVol, profit: currentProfit, volGrowth: vGrowth, profitGrowth: pGrowth }

    }, [yearShipments, selectedYear])


    // 2. Top Clients
    const topClients = React.useMemo(() => {
        const map = new Map<string, number>()
        yearShipments.forEach(s => {
            const name = s.client || "Unknown"
            map.set(name, (map.get(name) || 0) + 1)
        })
        return Array.from(map.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }))
    }, [yearShipments])


    // 3. Top Routes (POL - POD)
    const topRoutes = React.useMemo(() => {
        const map = new Map<string, number>()
        yearShipments.forEach(s => {
            const route = `${s.pol} → ${s.pod}`
            map.set(route, (map.get(route) || 0) + 1)
        })
        return Array.from(map.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([route, count]) => ({ route, count }))
    }, [yearShipments])


    // 4. Container Type Distribution
    const containerTypes = React.useMemo(() => {
        const map = new Map<string, number>()
        yearShipments.forEach(s => {
            const type = s.containerType || "Other"
            map.set(type, (map.get(type) || 0) + 1)
        })
        return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
    }, [yearShipments])


    // 5. Chart Data (Volume & Profit over Time) - Same as before but robust
    const chartData = React.useMemo(() => {
        const grouped = new Map<string, { label: string, dateStr: string, volume: number, profit: number }>()

        yearShipments.forEach(s => {
            const d = s.loadingDate ? parseISO(s.loadingDate) : new Date(s.createdAt)
            let key = ""
            let label = ""

            if (viewMode === 'day') {
                key = format(d, 'yyyy-MM-dd')
                label = format(d, 'MM/dd')
            } else if (viewMode === 'week') {
                const weekStart = startOfWeek(d, { weekStartsOn: 1 })
                key = format(weekStart, 'yyyy-MM-dd')
                label = `W${format(weekStart, 'w')}`
            } else {
                key = format(d, 'yyyy-MM')
                label = format(d, 'MMM')
            }

            if (!grouped.has(key)) grouped.set(key, { label, dateStr: key, volume: 0, profit: 0 })
            const entry = grouped.get(key)!
            entry.volume += 1

            const rate = s.exchangeRate || 7.2
            const p = (((s.oceanFreightPrice || 0) - (s.oceanFreightCost || 0)) * rate) + ((s.truckingFeePrice || 0) - (s.truckingFeeCost || 0)) + ((s.customsFeePrice || 0) - (s.customsFeeCost || 0))
            entry.profit += p
        })

        return Array.from(grouped.values()).sort((a, b) => a.dateStr.localeCompare(b.dateStr))
    }, [yearShipments, viewMode])

    const monthlyProfitData = React.useMemo(() => {
        // Re-use chartData if viewMode is month, otherwise force recalc for Month view
        // To be safe, let's just force recalc simply
        const grouped = new Map<string, { label: string, dateStr: string, profit: number }>()
        yearShipments.forEach(s => {
            const d = s.loadingDate ? parseISO(s.loadingDate) : new Date(s.createdAt)
            const key = format(d, 'yyyy-MM')
            const label = format(d, 'MMM')
            if (!grouped.has(key)) grouped.set(key, { label, dateStr: key, profit: 0 })
            const entry = grouped.get(key)!
            const rate = s.exchangeRate || 7.2
            const p = (((s.oceanFreightPrice || 0) - (s.oceanFreightCost || 0)) * rate) + ((s.truckingFeePrice || 0) - (s.truckingFeeCost || 0)) + ((s.customsFeePrice || 0) - (s.customsFeeCost || 0))
            entry.profit += p
        })
        return Array.from(grouped.values()).sort((a, b) => a.dateStr.localeCompare(b.dateStr))
    }, [yearShipments])


    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
                    <p className="text-muted-foreground">Comprehensive insights for {selectedYear} performance.</p>
                </div>
                <div className="flex items-center gap-2 bg-card border rounded-lg p-1 shadow-sm">
                    <Calendar className="w-4 h-4 ml-2 text-muted-foreground" />
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer py-1 pr-3"
                    >
                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-background border-indigo-100 dark:border-indigo-900/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-900 dark:text-indigo-300">Total Volume</CardTitle>
                        <Box className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline justify-between">
                            <div className="text-3xl font-bold text-indigo-700 dark:text-indigo-400">{vol}</div>
                            {volGrowth !== 0 && (
                                <div className={cn("flex items-center text-xs font-medium", volGrowth > 0 ? "text-emerald-600" : "text-rose-600")}>
                                    {volGrowth > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                                    {Math.abs(volGrowth).toFixed(1)}% <span className="text-muted-foreground ml-1">vs last mo</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background border-emerald-100 dark:border-emerald-900/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-900 dark:text-emerald-300">Total Net Profit</CardTitle>
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline justify-between">
                            <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">¥ {profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            {profitGrowth !== 0 && (
                                <div className={cn("flex items-center text-xs font-medium", profitGrowth > 0 ? "text-emerald-600" : "text-rose-600")}>
                                    {profitGrowth > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                                    {Math.abs(profitGrowth).toFixed(1)}% <span className="text-muted-foreground ml-1">vs last mo</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 1: Trends */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Profit Trend</CardTitle>
                        <CardDescription>Monthly net earnings (CNY).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={monthlyProfitData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="label" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `¥${v / 1000}k`} />
                                    <Tooltip
                                        contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                                        formatter={(val: number) => [`¥ ${val.toFixed(2)}`, 'Profit']}
                                    />
                                    <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: "#10b981", stroke: "#fff" }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="space-y-1">
                            <CardTitle>Shipment Volume</CardTitle>
                            <CardDescription>Containers per period.</CardDescription>
                        </div>
                        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border">
                            <Button variant={viewMode === 'day' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('day')} className="h-7 text-xs px-2">Day</Button>
                            <Button variant={viewMode === 'week' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('week')} className="h-7 text-xs px-2">Week</Button>
                            <Button variant={viewMode === 'month' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('month')} className="h-7 text-xs px-2">Month</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="label" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                                    <Bar dataKey="volume" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 2: Distribution & Top Lists */}
            <div className="grid gap-4 md:grid-cols-3">
                {/* 1. Container Distribution */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Container Types</CardTitle>
                        <CardDescription>Volume distribution by size.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={containerTypes}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {containerTypes.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                                <span className="text-2xl font-bold">{vol}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Top Clients */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-4 h-4" /> Top Clients
                        </CardTitle>
                        <CardDescription>Highest volume shippers.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[70%]">Client</TableHead>
                                    <TableHead className="text-right">Vol</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topClients.length > 0 ? topClients.map((c, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="font-medium truncate max-w-[120px]" title={c.name}>{c.name}</TableCell>
                                        <TableCell className="text-right">{c.count}</TableCell>
                                    </TableRow>
                                )) : <TableRow><TableCell colSpan={2} className="text-center text-xs text-muted-foreground">No data</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* 3. Top Routes */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> Top Routes
                        </CardTitle>
                        <CardDescription>Most frequent POL-POD pairs.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[70%]">Route</TableHead>
                                    <TableHead className="text-right">Vol</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topRoutes.length > 0 ? topRoutes.map((r, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="font-medium text-xs truncate max-w-[120px]" title={r.route}>{r.route}</TableCell>
                                        <TableCell className="text-right">{r.count}</TableCell>
                                    </TableRow>
                                )) : <TableRow><TableCell colSpan={2} className="text-center text-xs text-muted-foreground">No data</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
