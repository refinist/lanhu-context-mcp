<template>
  <div class="bg-[rgba(240,240,240,1)] min-h-screen flex flex-col pb-[93px]">
    <!-- Greeting Section -->
    <div class="px-[20px] pt-[48px]">
      <div class="w-[335px] h-[53px] flex flex-row justify-between">
        <div class="w-[244px] h-[53px] flex flex-row justify-between">
          <img
            class="w-[48px] h-[48px] mt-[2px] rounded-full"
            src="@/assets/imgs/home/avatar.png"
            alt="avatar"
          />
          <div class="w-[180px] h-[53px] flex flex-col justify-between">
            <span
              class="text-[rgba(18,18,18,1)] text-[24px] tracking-[-0.3px] font-semibold text-left whitespace-nowrap leading-[35px]"
            >
              Hi, Jonathan
            </span>
            <span
              class="text-[rgba(18,18,18,0.5)] text-[14px] font-normal text-left whitespace-nowrap leading-[18px]"
            >
              What's your plan for today?
            </span>
          </div>
        </div>
        <div class="relative w-[24px] h-[24px] mt-[2px]">
          <img
            class="w-[24px] h-[24px]"
            src="@/assets/imgs/home/bell-notification.png"
            alt="notification"
          />
          <div
            class="absolute bg-[rgba(247,54,54,1)] w-[8px] h-[8px] top-[-2px] right-0 rounded-[50%] border-2 border-solid border-[rgba(240,240,240,1)]"
          />
        </div>
      </div>
    </div>

    <!-- Workout Cards (Horizontal Scroll) -->
    <div
      class="mt-[20px] flex gap-[12px] overflow-x-auto scrollbar-hide pl-[20px] pr-[20px]"
    >
      <!-- Strength Session Card -->
      <div
        class="relative w-[276px] h-[220px] rounded-[12px] overflow-hidden flex-shrink-0"
      >
        <img
          class="absolute inset-0 w-full h-full object-cover"
          src="@/assets/imgs/home/card-strength.png"
          alt="strength session"
        />
        <div
          class="absolute bottom-0 left-0 right-0 h-[110px] bg-gradient-to-t from-[rgba(18,18,18,1)] to-[rgba(18,18,18,0)]"
        >
          <div
            class="w-[134px] h-[85px] ml-[20px] mt-[5px] flex flex-col justify-between"
          >
            <span
              class="text-white text-[30px] tracking-[-0.1px] font-semibold text-left leading-[30px]"
            >
              Strength
              <br />
              Session
            </span>
            <span
              class="text-white text-[13px] font-normal text-left whitespace-nowrap leading-[21px] mt-[4px]"
            >
              30 mins
            </span>
          </div>
        </div>
      </div>

      <!-- Run with Coach Card -->
      <div
        class="relative w-[276px] h-[220px] rounded-[12px] overflow-hidden flex-shrink-0"
      >
        <img
          class="absolute inset-0 w-full h-full object-cover"
          src="@/assets/imgs/home/card-run.png"
          alt="run with coach"
        />
        <div
          class="absolute bottom-0 left-0 right-0 h-[110px] bg-gradient-to-t from-[rgba(18,18,18,1)] to-[rgba(18,18,18,0)]"
        >
          <span
            class="w-[216px] text-white text-[30px] tracking-[-0.1px] font-semibold text-left leading-[30px] ml-[20px] mt-[5px] block"
          >
            Run with
            <br />
            Coach Justin
          </span>
          <div
            class="w-[124px] h-[21px] ml-[20px] mt-[4px] flex flex-row justify-between"
          >
            <span
              class="text-white text-[13px] font-normal text-left whitespace-nowrap leading-[21px]"
            >
              6:40 / km
            </span>
            <span
              class="text-white text-[13px] font-normal text-left whitespace-nowrap leading-[21px]"
            >
              52 mins
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Yesterday Section -->
    <div class="px-[20px] mt-[20px] mb-[13px]">
      <span
        class="text-[rgba(18,18,18,1)] text-[24px] tracking-[-0.3px] font-semibold text-left whitespace-nowrap leading-[35px]"
      >
        Yesterday
      </span>
    </div>

    <!-- Stats Card -->
    <div
      class="mx-[20px] shadow-[0px_20px_50px_0px_rgba(64,72,82,0.15)] bg-white w-[335px] rounded-[20px] flex flex-col"
    >
      <!-- Stats Row -->
      <div
        class="w-[295px] h-[69px] ml-[20px] mt-[20px] border-b border-solid border-[rgba(18,18,18,0.1)] flex flex-row"
      >
        <div class="flex-1 flex flex-col">
          <span
            class="text-[rgba(115,123,139,1)] text-[13px] font-normal text-left whitespace-nowrap leading-[13px]"
          >
            Steps
          </span>
          <span
            class="text-[rgba(18,18,18,1)] text-[28px] tracking-[-0.3px] font-medium text-left whitespace-nowrap leading-[28px] mt-[8px]"
          >
            21.898
          </span>
        </div>
        <div class="flex-1 flex flex-col">
          <span
            class="text-[rgba(115,123,139,1)] text-[13px] font-normal text-left whitespace-nowrap leading-[13px]"
          >
            Distance (km)
          </span>
          <span
            class="text-[rgba(18,18,18,1)] text-[28px] tracking-[-0.3px] font-medium text-left whitespace-nowrap leading-[28px] mt-[8px]"
          >
            17.5
          </span>
        </div>
      </div>

      <!-- Strength Activity -->
      <div
        class="w-[295px] h-[59px] ml-[20px] mt-[16px] flex flex-row items-center border-b border-solid border-[rgba(18,18,18,0.1)]"
      >
        <div
          class="bg-[rgba(207,245,0,1)] w-[43px] h-[43px] rounded-[100px] flex items-center justify-center"
        >
          <img
            class="w-[19px] h-[23px]"
            src="@/assets/imgs/home/activity-strength.png"
            alt="strength"
          />
        </div>
        <div class="w-[188px] h-[37px] ml-[12px] flex flex-col justify-between">
          <span
            class="text-[rgba(18,18,18,1)] text-[14px] font-semibold text-left whitespace-nowrap leading-[20px]"
          >
            Strength Session
          </span>
          <span
            class="text-[rgba(18,18,18,0.5)] text-[13px] font-normal text-left whitespace-nowrap leading-[13px] mt-[2px]"
          >
            30 mins • 182 kcal
          </span>
        </div>
        <img
          class="w-[24px] h-[24px] ml-[28px]"
          src="@/assets/imgs/home/arrow-right.png"
          alt="arrow"
        />
      </div>

      <!-- Running Activity -->
      <div
        class="w-[295px] h-[59px] ml-[20px] mt-[16px] flex flex-row items-center border-b border-solid border-[rgba(18,18,18,0.1)]"
      >
        <div
          class="bg-[rgba(166,108,255,1)] w-[43px] h-[43px] rounded-[100px] flex items-center justify-center"
        >
          <img
            class="w-[19px] h-[23px]"
            src="@/assets/imgs/home/activity-running.png"
            alt="running"
          />
        </div>
        <div class="w-[188px] h-[37px] ml-[12px] flex flex-col justify-between">
          <span
            class="text-[rgba(18,18,18,1)] text-[14px] font-semibold text-left whitespace-nowrap leading-[20px]"
          >
            Yogyakarta Running
          </span>
          <span
            class="text-[rgba(18,18,18,0.5)] text-[13px] font-normal text-left whitespace-nowrap leading-[13px] mt-[2px]"
          >
            24:14 • 3,53 km • 215 kcal
          </span>
        </div>
        <img
          class="w-[24px] h-[24px] ml-[28px]"
          src="@/assets/imgs/home/arrow-right.png"
          alt="arrow"
        />
      </div>

      <!-- More Activities -->
      <div
        class="w-[295px] h-[24px] ml-[20px] mt-[16px] mb-[20px] flex flex-row justify-between items-center"
      >
        <span
          class="text-[rgba(18,18,18,1)] text-[14px] font-semibold text-left whitespace-nowrap leading-[20px]"
        >
          + 3 more activities
        </span>
        <img
          class="w-[24px] h-[24px]"
          src="@/assets/imgs/home/arrow-right.png"
          alt="arrow"
        />
      </div>
    </div>

    <!-- Bottom Tab Bar -->
    <div
      class="fixed bottom-0 left-0 right-0 bg-white h-[93px] flex flex-col z-10"
    >
      <div class="w-[329px] h-[39px] ml-[20px] mt-[38px] flex flex-row">
        <div
          class="w-[53px] h-[38px] flex flex-col justify-between items-center"
        >
          <img
            class="w-[19px] h-[21px]"
            src="@/assets/imgs/home/tab-home.png"
            alt="home"
          />
          <span
            class="text-[rgba(18,18,18,1)] text-[10px] font-medium text-center whitespace-nowrap leading-[10px] mt-[7px]"
          >
            Home
          </span>
        </div>
        <div
          class="w-[34px] h-[39px] ml-[51px] flex flex-col justify-between items-center"
        >
          <img
            class="w-[19px] h-[20px]"
            src="@/assets/imgs/home/tab-search.png"
            alt="search"
          />
          <span
            class="text-[rgba(18,18,18,0.5)] text-[10px] font-medium text-center whitespace-nowrap leading-[10px] mt-[9px]"
          >
            Search
          </span>
        </div>
        <div
          class="w-[34px] h-[39px] ml-[60px] flex flex-col justify-between items-center"
        >
          <img
            class="w-[20px] h-[20px]"
            src="@/assets/imgs/home/tab-library.png"
            alt="library"
          />
          <span
            class="text-[rgba(18,18,18,0.5)] text-[10px] font-medium text-center whitespace-nowrap leading-[10px] mt-[9px]"
          >
            Library
          </span>
        </div>
        <div
          class="w-[40px] h-[37px] ml-[57px] mt-[2px] flex flex-col justify-between items-center"
        >
          <img
            class="w-[16px] h-[15px]"
            src="@/assets/imgs/home/tab-settings.png"
            alt="settings"
          />
          <span
            class="text-[rgba(18,18,18,0.5)] text-[10px] font-medium text-center whitespace-nowrap leading-[10px] mt-[12px]"
          >
            Settings
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
