export interface SurveyCityInterface {
    id: number;
    city: string;
    district: string;
    active: boolean;
    type: 'allowed' | 'survey';
    voted: boolean;
}
