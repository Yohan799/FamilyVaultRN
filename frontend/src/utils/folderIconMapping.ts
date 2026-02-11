import {
    Home, Building2, Mountain, Factory, Key, FileText,
    ScrollText, ClipboardList, Pill, TestTube, Hospital,
    Syringe, GraduationCap, Award, IdCard, FileCheck,
    Car, Building, Plane, Landmark, Folder, Briefcase
} from 'lucide-react-native';

export interface FolderStyle {
    icon: any;
    bgColor: string;
    iconColor: string;
}

const folderKeywords: { [key: string]: FolderStyle } = {
    // Real Estate
    'residential|house|apartment|home': {
        icon: Home,
        bgColor: '#FEE2E2',
        iconColor: '#EF4444'
    },
    'commercial|office|shop|store': {
        icon: Building2,
        bgColor: '#DBEAFE',
        iconColor: '#3B82F6'
    },
    'land|plot|terrain': {
        icon: Mountain,
        bgColor: '#D1FAE5',
        iconColor: '#10B981'
    },
    'industrial|factory|warehouse': {
        icon: Factory,
        bgColor: '#E0E7FF',
        iconColor: '#6366F1'
    },
    'rental|lease|tenant': {
        icon: Key,
        bgColor: '#FEF3C7',
        iconColor: '#F59E0B'
    },

    // Medical
    'prescription|medicine|drug': {
        icon: Pill,
        bgColor: '#FCE7F3',
        iconColor: '#EC4899'
    },
    'test|lab|report': {
        icon: TestTube,
        bgColor: '#DDD6FE',
        iconColor: '#8B5CF6'
    },
    'hospital|clinic|medical': {
        icon: Hospital,
        bgColor: '#DBEAFE',
        iconColor: '#3B82F6'
    },
    'vaccination|vaccine|immunization': {
        icon: Syringe,
        bgColor: '#D1FAE5',
        iconColor: '#10B981'
    },

    // Education
    'certificate|certification': {
        icon: Award,
        bgColor: '#FEF3C7',
        iconColor: '#F59E0B'
    },
    'degree|graduation|diploma': {
        icon: GraduationCap,
        bgColor: '#DBEAFE',
        iconColor: '#3B82F6'
    },
    'id|identity|student': {
        icon: IdCard,
        bgColor: '#E0E7FF',
        iconColor: '#6366F1'
    },

    // Insurance
    'vehicle|car|auto': {
        icon: Car,
        bgColor: '#E0E7FF',
        iconColor: '#6366F1'
    },
    'property|building': {
        icon: Building,
        bgColor: '#FEE2E2',
        iconColor: '#EF4444'
    },
    'travel|trip': {
        icon: Plane,
        bgColor: '#DBEAFE',
        iconColor: '#3B82F6'
    },

    // Personal/Legal
    'bank|account|financial': {
        icon: Landmark,
        bgColor: '#D1FAE5',
        iconColor: '#10B981'
    },
    'legal|contract|agreement': {
        icon: ScrollText,
        bgColor: '#E0E7FF',
        iconColor: '#6366F1'
    },
    'tax|return': {
        icon: FileText,
        bgColor: '#FEF3C7',
        iconColor: '#F59E0B'
    },
    'document|file|paper': {
        icon: ClipboardList,
        bgColor: '#F3F4F6',
        iconColor: '#6B7280'
    },
    'work|business|professional': {
        icon: Briefcase,
        bgColor: '#DBEAFE',
        iconColor: '#3B82F6'
    }
};

/**
 * Get folder icon and color based on folder name using keyword matching
 */
export function getFolderStyle(folderName: string): FolderStyle {
    const nameLower = folderName.toLowerCase();

    for (const [keywords, style] of Object.entries(folderKeywords)) {
        const patterns = keywords.split('|');
        if (patterns.some(pattern => nameLower.includes(pattern))) {
            return style;
        }
    }

    // Default folder style
    return {
        icon: Folder,
        bgColor: '#E8F0FE',
        iconColor: '#4F46E5'
    };
}
