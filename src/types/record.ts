export type ShipmentRecord = {
    id: string;
    createdAt: number;

    // Basic Info
    bookingNo: string;        // 订舱号
    businessNo: string;       // 业务单号
    shipper: string;          // 托运人
    client: string;           // 客户
    fleet: string;            // 车队

    // Logistics
    loadingDate: string;      // 装货日期
    sailingDate: string;      // 开船日
    arrivalDate: string;      // 到港日期
    pol: string;             // 起运港
    pod: string;             // 目的港
    vesselName: string;       // 航名
    containerType: string;    // 条柜 (e.g. 40HQ)
    containerNo: string;      // 箱号

    // Fees - Profit Generating (Cost vs Price)
    // Ocean Freight is USD, others default to CNY
    oceanFreightCost: number; // 海运费 (成本) - USD
    oceanFreightPrice: number; // 海运费 (销售) - USD
    truckingFeeCost: number;  // 拖车费 (成本)
    truckingFeePrice: number; // 拖车费 (销售)
    customsFeeCost: number;   // 报关费 (成本)
    customsFeePrice: number;  // 报关费 (销售)

    // Fees - Simple
    // Fees - Additional (Cost vs Price)
    thcCost: number;
    thcPrice: number;
    printingFeeCost: number;
    printingFeePrice: number;
    sealFeeCost: number;
    sealFeePrice: number;
    docFeeCost: number;
    docFeePrice: number;
    telexFeeCost: number;
    telexFeePrice: number;
    blFeeCost: number;
    blFeePrice: number;
    diffPickupFeeCost: number;
    diffPickupFeePrice: number;
    weighingFeeCost: number;
    weighingFeePrice: number;

    // Optional Fees (Cost vs Price)
    vgmFeeCost?: number;
    vgmFeePrice?: number;
    amendmentFeeCost?: number;
    amendmentFeePrice?: number;
    detentionFeeCost?: number;
    detentionFeePrice?: number;
    demurrageFeeCost?: number;
    demurrageFeePrice?: number;
    handlingFeeCost?: number;
    handlingFeePrice?: number;
    insuranceFeeCost?: number;
    insuranceFeePrice?: number;

    // Settings
    exchangeRate: number; // USD to CNY rate

    // Status
    isSpecialDeclaration: boolean; // 特报 (Yes/No)
};

export const DEFAULT_EXCHANGE_RATE = 7.2;
