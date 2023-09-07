import { ExerciseCard } from "@components/ExerciseCard";
import { Group } from "@components/Group";
import { HomeHeader } from "@components/HomeHeader";
import { useNavigation } from "@react-navigation/native";
import { AppNavigatorRoutesProps } from "@routes/app.routes";
import { FlatList, HStack, Heading, Text, VStack } from "native-base";
import { useState } from "react";

export function Home() {

  const [groups, setGroups] = useState(["costas", "ombro", "braço", "perna"])
  const [exercises, setExercises] = useState(["Remada", "Puxada", "Flexão"])
  const [groupSelected, setGroupSelected] = useState("costas")

  const navigation = useNavigation<AppNavigatorRoutesProps>()
  function handleOpenExerciseDetails() {
    navigation.navigate('exercise')
  }
  return (
    <VStack flex={1}>
      <HomeHeader />

      <FlatList
        data={groups}
        keyExtractor={item => item}
        showsHorizontalScrollIndicator={false}
        horizontal
        renderItem={({ item }) => (
          <Group
            name={item}
            isActive={groupSelected === item}
            onPress={() => setGroupSelected(item)}
          />
        )}
        _contentContainerStyle={{ px: 8 }}
        my={10}
        maxH={10}
        minH={10}
      />

      <VStack flex={1} px={8}>
        <HStack justifyContent="space-between" mb={5}>
          <Heading color="gray.200" fontSize="md" fontFamily="heading" >Exercicios</Heading>
          <Text color="gray.200" fontSize="sm">{exercises.length}</Text>
        </HStack>


        <FlatList
          data={exercises}
          keyExtractor={item => item}
          renderItem={({ item }) => (<ExerciseCard onPress={handleOpenExerciseDetails} />)}
          showsVerticalScrollIndicator={false}
          _contentContainerStyle={{ pb: 20 }}
        />


      </VStack>
    </VStack>
  )
}