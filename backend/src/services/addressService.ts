import { createError } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';

export interface CreateAddressData {
  country: string;
  city: string;
  street: string;
  building: string;
  latitude?: number;
  longitude?: number;
}

export interface CreateApartmentData {
  addressId: string;
  number: string;
}

export const addressService = {
  async findOrCreateAddress(data: CreateAddressData) {
    // Поиск существующего адреса
    let address = await prisma.address.findUnique({
      where: {
        country_city_street_building: {
          country: data.country,
          city: data.city,
          street: data.street,
          building: data.building,
        },
      },
    });

    // Создание нового адреса, если не найден
    if (!address) {
      address = await prisma.address.create({
        data: {
          country: data.country,
          city: data.city,
          street: data.street,
          building: data.building,
          latitude: data.latitude,
          longitude: data.longitude,
        },
      });
    } else if (data.latitude && data.longitude && (!address.latitude || !address.longitude)) {
      // Обновление координат, если они были не указаны
      address = await prisma.address.update({
        where: { id: address.id },
        data: {
          latitude: data.latitude,
          longitude: data.longitude,
        },
      });
    }

    return address;
  },

  async findOrCreateApartment(data: CreateApartmentData) {
    // Поиск существующей квартиры
    let apartment = await prisma.apartment.findUnique({
      where: {
        addressId_number: {
          addressId: data.addressId,
          number: data.number,
        },
      },
    });

    // Создание новой квартиры, если не найдена
    if (!apartment) {
      apartment = await prisma.apartment.create({
        data: {
          addressId: data.addressId,
          number: data.number,
        },
      });
    }

    return apartment;
  },
};

