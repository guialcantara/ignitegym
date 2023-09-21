import { Button } from "@components/Button";
import { Input } from "@components/Input";
import { ScreenHeader } from "@components/ScreenHeader";
import { UserPhoto } from "@components/UserPhoto";
import { Center, ScrollView, VStack, Skeleton, Text, Heading, useToast } from "native-base";
import { useState } from "react";
import { TouchableOpacity } from "react-native";
import { Controller, useForm } from 'react-hook-form'
import defaultUserPhotoImg from '@assets/userPhotoDefault.png'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import * as yup from 'yup'
import { yupResolver } from "@hookform/resolvers/yup"
import { useAuth } from "@hooks/useAuth";
import { api } from "@services/api";
import { AppError } from "@utils/AppError";

const PHOTO_SIZE = 33

type FormDataProps = {
  name: string
  email: string
  password: string
  old_password: string
  confirm_password: string
}

const profileSchema = yup.object({
  name: yup.string().required('Informe o nome.'),
  email: yup.string(),
  old_password: yup.string(),
  password: yup.string().min(6, 'A senha deve ter pelo menos 6 dígitos.').nullable().transform((value) => !!value ? value : null),
  confirm_password: yup
    .string()
    .nullable()
    .transform((value) => !!value ? value : null)
    .oneOf([yup.ref('password')], 'A confirmação de senha não confere')
    .when('password', {
      is: (Field: any) => Field,
      then: (schema) => schema.nullable().required('Informe a confirmação da senha.').nullable().transform((value) => !!value ? value : null),
    })
})



export function Profile() {
  const [photoIsLoading, setPhotoIsLoading] = useState(false)
  const [updating, setUpdating] = useState(false)

  const toast = useToast()
  const { user, updateUserProfile } = useAuth()

  const { control, handleSubmit, formState: { errors } } = useForm<FormDataProps>({
    defaultValues: {
      name: user.name,
      email: user.email
    },
    resolver: yupResolver<any>(profileSchema)
  })

  async function handleUserPhotoSelect() {
    setPhotoIsLoading(true)
    try {
      const photoSelected = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        aspect: [4, 4],
        allowsEditing: true,
        allowsMultipleSelection: false
      })

      if (photoSelected.canceled) {
        console.log('cancelado')
        return;
      }
      if (photoSelected.assets[0].uri) {
        const photoInfo = await FileSystem.getInfoAsync(photoSelected.assets[0].uri, { size: true }) as FileSystem.FileInfo
        console.log(photoInfo)
        if (photoInfo.size && (photoInfo.size / 1024 / 1024) > 5) {
          return toast.show({
            title: "Essa Imagem é muito grande. Escolha uma de até 5MB",
            placement: 'top',
            bgColor: 'red.500'
          })
        }
        const fileExtension = photoSelected.assets[0].uri.split('.').pop()

        const photoFile = {
          name: `${user.name}.${fileExtension}`.toLowerCase(),
          uri: photoSelected.assets[0].uri,
          type: `${photoSelected.assets[0].type}/${fileExtension}`
        } as any
        console.log(photoFile)
        const userPhotoUploadForm = new FormData();
        userPhotoUploadForm.append('avatar', photoFile)

        const avatarUpdatedResponse = await api.patch('/users/avatar', userPhotoUploadForm, {
          headers: {
            accept: 'application/json',
            "Content-Type": 'multipart/form-data'
          }
        })

        const userUpdated = user;
        userUpdated.avatar = avatarUpdatedResponse.data.avatar
        updateUserProfile(userUpdated)

        toast.show({
          title: "foto atualizada",
          placement: 'top',
          bgColor: 'green.500'
        })

      }
    } catch (error) {
      console.log(error)
    } finally {
      setPhotoIsLoading(false)
    }
  }

  async function handleProfileUpdate(data: FormDataProps) {
    try {
      setUpdating(true)

      const userUpdated = user
      userUpdated.name = data.name

      await api.put('/users', data)

      await updateUserProfile(userUpdated)

      toast.show({
        title: 'Perfil atualizado com sucesso!',
        placement: 'top',
        bgColor: 'green.500'
      })
    } catch (error) {
      const isAppError = error instanceof AppError
      const title = isAppError ? error.message : "Não foi possível atualizar"

      toast.show({
        title,
        placement: 'top',
        bgColor: 'red.500'
      })
    } finally {
      setUpdating(false)
    }
  }

  return (
    <VStack flex={1}>
      <ScreenHeader title="Perfil" />
      <ScrollView>
        <Center mt={6} px={10}>

          {photoIsLoading ?
            <Skeleton
              w={PHOTO_SIZE}
              h={PHOTO_SIZE}
              rounded='full'
              startColor="gray.500"
              endColor="gray.400"
            />
            :
            <UserPhoto
              source={
                user.avatar
                  ? { uri: `${api.defaults.baseURL}/avatar/${user.avatar}` }
                  : defaultUserPhotoImg
              }
              alt="Foto do usuário"
              size={PHOTO_SIZE}
            />
          }
          <TouchableOpacity onPress={handleUserPhotoSelect}>
            <Text color="green.500" fontWeight="bold" fontSize="md" mt={2} mb={8}>
              Alterar foto
            </Text>
          </TouchableOpacity>
          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange } }) => (
              <Input value={value} onChangeText={onChange} bg="gray.600" placeholder="Nome" errorMessage={errors.name?.message} />
            )}
          />
          <Controller
            control={control}
            name="email"
            render={({ field: { value } }) => (
              <Input value={value} bg="gray.600" placeholder="E-mail" isDisabled isReadOnly />
            )}
          />


        </Center>

        <VStack px={10} mt={12} mb={9}>
          <Heading color="gray.200" fontSize="md" fontFamily="heading" mb={2} >Alterar senha</Heading>
          <Controller
            control={control}
            name="old_password"
            render={({ field: { onChange } }) => (
              <Input onChangeText={onChange} bg="gray.600" placeholder="Senha antiga" secureTextEntry />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange } }) => (
              <Input onChangeText={onChange} bg="gray.600" placeholder="Nova senha" secureTextEntry errorMessage={errors.password?.message} />
            )}
          />

          <Controller
            control={control}
            name="confirm_password"
            render={({ field: { onChange } }) => (
              <Input onChangeText={onChange} bg="gray.600" placeholder="Confirme Nova senha" secureTextEntry errorMessage={errors.confirm_password?.message} />
            )}
          />

          <Button title="Atualizar" onPress={handleSubmit(handleProfileUpdate)} isLoading={updating} />
        </VStack>
      </ScrollView>
    </VStack>
  )
}