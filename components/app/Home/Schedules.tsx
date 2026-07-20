import {View} from "react-native";
import React from "react";
import { router } from "expo-router";
import { CustomText } from "@/components/CustomText";
import TouchOpacity from "@/components/TouchOpacity";
import { Colors } from "@/constants/Colors";
import CalendarIcon from "@/assets/icons/calendar";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import HomeSection from "@/components/HomeSection";
import { useSchedule } from "@/contexts/ScheduleContext";

export const schedulesSection = {
  all: "all",
  today: "today",
}

const Schedules = () => {
  const { t } = useTranslation();
  const { scheduledServicesData } = useSchedule();
  const hasSchedules = scheduledServicesData && scheduledServicesData.length > 0;

	return (
		<HomeSection
			title="Agendamentos"
		>
			<View className="flex-1">
				<View className="pt-4 px-5">
					<View className="border border-gray_strong rounded-3xl px-4 py-3">
						<TouchOpacity
							onPress={() => router.push(`/(app)/(bottom-sheets)/(services)/schedules/${schedulesSection.today}`)}
							otherClasses="flex-row items-center justify-between"
						>
							<View className="w-12 h-12 rounded-xl items-center justify-center mr-3">
								<CalendarIcon color={Colors.support_primary}/>
							</View>
							<View className="flex-1">
								{hasSchedules ? (
									<>
										<CustomText color="secondary" boldness="semiBold" size="medium">
											{t("schedules.agenda")}
										</CustomText>
										<CustomText color="gray_medium" boldness="medium" size="small">
											{scheduledServicesData.length} {t("schedules.services_count", { count: scheduledServicesData.length })}
										</CustomText>
									</>
								) : (
									<CustomText color="gray_medium" boldness="medium" size="medium">
										{t("schedules.empty")}
									</CustomText>
								)}
							</View>
							<Feather name="chevron-right" size={30} color={Colors.support_primary} />
						</TouchOpacity>
					</View>
				</View>
			</View>
		</HomeSection>
	);
}

export default Schedules;
