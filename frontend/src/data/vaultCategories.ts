// Vault Categories Data for React Native
// Note: We use string icon names instead of Lucide components
// The icon components should be resolved at render time

export interface Subcategory {
    id: string;
    name: string;
    icon: { name: string };
    documentCount: number;
}

export interface Category {
    id: string;
    name: string;
    icon: { name: string };
    iconBgColor: string;
    documentCount: number;
    subcategories: Subcategory[];
    isCustom?: boolean;
}

export const vaultCategories: Category[] = [
    {
        id: "real-estate",
        name: "Real Estate",
        icon: { name: "Home" },
        iconBgColor: "#FEE2E2", // bg-red-100
        documentCount: 0,
        subcategories: [
            { id: "residential", name: "Residential Property", icon: { name: "Home" }, documentCount: 0 },
            { id: "commercial", name: "Commercial Property", icon: { name: "Building2" }, documentCount: 0 },
            { id: "land", name: "Land", icon: { name: "Mountain" }, documentCount: 0 },
            { id: "industrial", name: "Industrial", icon: { name: "Factory" }, documentCount: 0 },
            { id: "rental", name: "Rental Properties", icon: { name: "Key" }, documentCount: 0 },
            { id: "property-tax", name: "Property Tax", icon: { name: "FileText" }, documentCount: 0 },
            { id: "sale-deeds", name: "Sale/Purchase Deeds", icon: { name: "ScrollText" }, documentCount: 0 },
            { id: "property-documents", name: "Property Documents", icon: { name: "ClipboardList" }, documentCount: 0 },
        ],
    },
    {
        id: "medical",
        name: "Medical",
        icon: { name: "Briefcase" },
        iconBgColor: "#DBEAFE", // bg-blue-100
        documentCount: 0,
        subcategories: [
            { id: "prescription", name: "Prescription", icon: { name: "Pill" }, documentCount: 0 },
            { id: "test-reports", name: "Test Reports", icon: { name: "TestTube" }, documentCount: 0 },
            { id: "hospital-records", name: "Hospital Records", icon: { name: "Hospital" }, documentCount: 0 },
            { id: "vaccination", name: "Vaccination Records", icon: { name: "Syringe" }, documentCount: 0 },
            { id: "insurance-claims", name: "Insurance Claims", icon: { name: "FileText" }, documentCount: 0 },
        ],
    },
    {
        id: "education",
        name: "Education",
        icon: { name: "GraduationCap" },
        iconBgColor: "#DBEAFE", // bg-blue-100
        documentCount: 0,
        subcategories: [
            { id: "certificates", name: "Certificates", icon: { name: "Award" }, documentCount: 0 },
            { id: "transcripts", name: "Transcripts", icon: { name: "ScrollText" }, documentCount: 0 },
            { id: "degrees", name: "Degrees", icon: { name: "GraduationCap" }, documentCount: 0 },
            { id: "id-cards", name: "ID Cards", icon: { name: "IdCard" }, documentCount: 0 },
            { id: "scholarships", name: "Scholarships", icon: { name: "FileCheck" }, documentCount: 0 },
        ],
    },
    {
        id: "insurance",
        name: "Insurance",
        icon: { name: "Shield" },
        iconBgColor: "#D1FAE5", // bg-green-100
        documentCount: 0,
        subcategories: [
            { id: "health", name: "Health", icon: { name: "Hospital" }, documentCount: 0 },
            { id: "life", name: "Life", icon: { name: "User" }, documentCount: 0 },
            { id: "vehicle", name: "Vehicle", icon: { name: "Car" }, documentCount: 0 },
            { id: "property", name: "Property", icon: { name: "Building" }, documentCount: 0 },
            { id: "travel", name: "Travel", icon: { name: "Plane" }, documentCount: 0 },
        ],
    },
    {
        id: "personal",
        name: "Personal",
        icon: { name: "User" },
        iconBgColor: "#FCE7F3", // bg-pink-100
        documentCount: 0,
        subcategories: [
            { id: "identity", name: "Identity", icon: { name: "IdCard" }, documentCount: 0 },
            { id: "bank", name: "Bank", icon: { name: "Landmark" }, documentCount: 0 },
            { id: "tax", name: "Tax", icon: { name: "FileText" }, documentCount: 0 },
            { id: "legal", name: "Legal", icon: { name: "ScrollText" }, documentCount: 0 },
            { id: "certificates", name: "Certificates", icon: { name: "Award" }, documentCount: 0 },
        ],
    },
];
