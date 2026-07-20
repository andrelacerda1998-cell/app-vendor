import HomeSection from "@/components/HomeSection";
import AvailabilityElements from "@/components/app/Schedule/AvailabilityElements";
import { router } from "expo-router";
import {View} from "react-native";

const ScheduleAvailability = () => {
  return (
    <HomeSection
      title="Disponibilidade"
      actionButton={() => router.push('/(app)/(bottom-sheets)/(services)/schedulesSettings')}
      actionButtonText="Configurações"
    >
      <View className="py-4 flex-1">
        <View className="justify-between px-5">
          <AvailabilityElements />
        </View>
      </View>
    </HomeSection>
  );
}

export default ScheduleAvailability;