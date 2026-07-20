import React, { useState, useEffect, useRef } from "react";
import { Polyline, Marker } from "react-native-maps";
import { Image } from "react-native";

type Coordinate = { latitude: number; longitude: number };

interface AnimatedPolylineProps {
    coordinates: Coordinate[];
    interval?: number;
    strokeColor?: string;
    strokeWidth?: number;
}

const AnimatedPolyline: React.FC<AnimatedPolylineProps> = ({
                                                               coordinates,
                                                               interval = 100,
                                                               ...props
                                                           }) => {
    const [coords, setCoords] = useState<Coordinate[]>([]);
    const [arrowCoord, setArrowCoord] = useState<Coordinate>({
        latitude: 0,
        longitude: 0,
    });

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const animate = (allCoords: Coordinate[]) => {
        let completed = 0;
        const len = allCoords.length;
        let tempCoords: Coordinate[] = [];
        const steps = Math.max(1, Math.floor(len / 20));

        if (intervalRef.current) clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
            tempCoords = [...tempCoords, ...allCoords.slice(completed, completed + steps)];

            setCoords(tempCoords);
            setArrowCoord(tempCoords[tempCoords.length - 1] || arrowCoord);

            if (completed >= len) {
                animate(allCoords);
            }

            completed += steps;
        }, interval);
    };

    useEffect(() => {
        animate(coordinates);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [coordinates]);

    return (
        <>
            <Polyline {...props} coordinates={coords} />
            <Marker coordinate={arrowCoord} anchor={{ x: 0.5, y: 0.5 }}>
                {/*<Image
                    source={require("./map.png")}
                    style={{ width: 20, height: 20, transform: [{ rotate: "45deg" }] }}
                />*/}
            </Marker>
        </>
    );
};

export default AnimatedPolyline;
